import { AutomationLogModel, ContactModel, NotificationModel } from "@jobflow/database/models";
import {
  buildAnthropicModelCandidates,
  callAnthropicMessages,
  resolveAnthropicApiKey,
} from "@jobflow/integrations/ai/anthropic-messages";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";
import { redactForLog } from "../utils/worker-error";

interface FollowUpSuggestion {
  subject: string;
  message: string;
  reason: string;
}

function resolveStaleContactDays(): number {
  const env = parseInt(process.env.NETWORK_FOLLOWUP_STALE_DAYS ?? "", 10);
  return Number.isFinite(env) && env > 0 ? env : 30;
}

function daysAgo(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() - days);
  return r;
}

async function writeLog(input: {
  tenantId: string;
  status: "Success" | "Warning" | "Failed";
  message: string;
  operationId: string;
  relatedRecordId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await AutomationLogModel.create({
      tenantId: input.tenantId,
      createdBy: "system",
      moduleKey: "network-follow-up",
      moduleName: "Network Follow-Up",
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      relatedRecordType: input.relatedRecordId ? "Contact" : undefined,
      relatedRecordId: input.relatedRecordId,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logger.error({ err: e }, "failed to write network-follow-up automation log");
  }
}

async function generateFollowUpSuggestion(input: {
  contactName: string;
  contactRole?: string;
  contactCompany?: string;
  relationship?: string;
  lastContacted?: Date;
  followUpReason?: string;
}): Promise<FollowUpSuggestion | null> {
  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) return null;

  const daysSince = input.lastContacted
    ? Math.floor((Date.now() - input.lastContacted.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const modelCandidates = buildAnthropicModelCandidates();
  const prompt = [
    "Generate a networking follow-up reminder suggestion. Return ONLY valid JSON.",
    "",
    'JSON shape: {"subject": "email subject line", "message": "2-4 sentence follow-up message body", "reason": "brief reason why follow-up is timely"}',
    "",
    "Rules:",
    "- Tone: warm, professional, not salesy",
    "- message: natural first-person message body (no greeting/closing needed)",
    "- subject: concise email subject line",
    "- reason: one sentence explaining why now is a good time to reconnect",
    "",
    `Contact: ${input.contactName}`,
    input.contactRole ? `Role: ${input.contactRole}` : "",
    input.contactCompany ? `Company: ${input.contactCompany}` : "",
    input.relationship ? `Relationship: ${input.relationship}` : "",
    daysSince != null ? `Last contacted: ${daysSince} days ago` : "Last contacted: unknown",
    input.followUpReason ? `Follow-up context: ${input.followUpReason}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 350, temperature: 0.4 });
    if (!result.ok) return null;

    const fenceMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenceMatch ? fenceMatch[1] : result.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as FollowUpSuggestion;
  } catch {
    return null;
  }
}

export async function processNetworkFollowUpJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const started = Date.now();
  const operationId = payload.operationId ?? `network-follow-up-${Date.now()}`;
  const tenantId = payload.tenantId;
  const now = payload.date ? new Date(payload.date) : new Date();
  const today = now.toISOString().slice(0, 10);
  const staleDays = resolveStaleContactDays();

  logger.info({ tenantId, operationId, staleDays }, "network follow-up sweep started");

  try {
    // Find warm contacts needing follow-up — two triggers:
    // 1. nextFollowUpDate is overdue and reminderEnabled
    // 2. lastContacted older than staleDays and reminderEnabled (no explicit follow-up date set)
    const contacts = await ContactModel.find({
      tenantId,
      archived: { $ne: true },
      reminderEnabled: true,
      // Idempotency: skip contacts already processed today
      networkFollowUpReminderKey: { $not: { $regex: `^nfu:${tenantId}:.*:${today}$` } },
      $or: [
        {
          nextFollowUpDate: { $lte: now },
          followUpStatus: { $in: ["Scheduled", "Due Today", "Overdue"] },
        },
        {
          lastContacted: { $lte: daysAgo(now, staleDays) },
          nextFollowUpDate: { $exists: false },
        },
        {
          lastContacted: { $exists: false },
          createdAt: { $lte: daysAgo(now, staleDays) },
        },
      ],
    })
      .select("_id name email role company relationship lastContacted nextFollowUpDate followUpReason followUpStatus networkFollowUpReminderKey")
      .sort({ nextFollowUpDate: 1, lastContacted: 1 })
      .limit(30)
      .lean() as Array<Record<string, unknown>>;

    logger.info({ tenantId, operationId, count: contacts.length }, "network follow-up contacts found");

    let reminded = 0;
    let failed = 0;

    for (const contact of contacts) {
      const contactId = String(contact._id);
      const contactName = String(contact.name ?? "Contact");
      const company = contact.company ? String(contact.company) : undefined;

      try {
        const reminderKey = `nfu:${tenantId}:${contactId}:${today}`;

        // Generate AI follow-up suggestion (JSON: subject, message, reason)
        const suggestion = await generateFollowUpSuggestion({
          contactName,
          contactRole: contact.role ? String(contact.role) : undefined,
          contactCompany: company,
          relationship: contact.relationship ? String(contact.relationship) : undefined,
          lastContacted: contact.lastContacted ? new Date(String(contact.lastContacted)) : undefined,
          followUpReason: contact.followUpReason ? String(contact.followUpReason) : undefined,
        });

        // Persist suggestion and mark reminded regardless of AI success
        const updateFields: Record<string, unknown> = {
          networkFollowUpReminderKey: reminderKey,
          networkFollowUpReminderSentAt: now,
          followUpStatus: "Sent",
          $unset: { networkFollowUpError: 1 },
        };

        if (suggestion) {
          updateFields.networkFollowUpSuggestion = redactForLog(suggestion.message, 1000);
          updateFields.networkFollowUpSuggestionSubject = suggestion.subject;
          updateFields.networkFollowUpSuggestionReason = suggestion.reason;
          updateFields.followUpMessagePreview = suggestion.message.slice(0, 300);
        }

        await ContactModel.findByIdAndUpdate(contactId, updateFields);

        // In-app bell notification (no external send — user acts on this)
        const notifTitle = `Follow up with ${contactName}`;
        const notifMessage = suggestion
          ? `${company ? `${company} — ` : ""}${suggestion.reason}`
          : `Time to reconnect with ${contactName}${company ? ` at ${company}` : ""}.`;

        try {
          await NotificationModel.create({
            tenantId,
            createdBy: "system",
            moduleKey: "network-follow-up",
            type: "network_followup_reminder",
            title: notifTitle,
            message: notifMessage,
            severity: "info",
            relatedRecordType: "Contact",
            relatedRecordId: contactId,
            actionUrl: `/contacts`,
            read: false,
          });
        } catch (e) {
          logger.warn({ err: e }, "network-follow-up: failed to create in-app notification");
        }

        await writeLog({
          tenantId,
          status: "Success",
          message: `Reminder created for ${contactName}${company ? ` at ${company}` : ""}${suggestion ? `: "${suggestion.subject}"` : " (no AI suggestion)"}`,
          operationId,
          relatedRecordId: contactId,
          metadata: {
            contactId,
            hasSuggestion: Boolean(suggestion),
            subject: suggestion?.subject,
            reason: suggestion?.reason,
          },
        });

        reminded += 1;
      } catch (error) {
        failed += 1;
        const msg = error instanceof Error ? error.message : "Unknown";
        logger.warn({ tenantId, operationId, contactId, error: msg }, "network follow-up failed for contact");
        try {
          await ContactModel.findByIdAndUpdate(contactId, { networkFollowUpError: msg });
        } catch { /* swallow */ }
      }
    }

    const skipped = contacts.length - reminded - failed;
    const durationMs = Date.now() - started;

    if (reminded > 0) {
      const names = contacts.slice(0, 5).map((c) => String(c.name ?? "Contact")).join(", ");
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "network-follow-up",
        event: "network-reminder",
        message: `${reminded} network follow-up reminder${reminded !== 1 ? "s" : ""} created: ${names}${contacts.length > 5 ? "..." : ""}`,
        operationId,
        metadata: { reminded, skipped, failed, durationMs },
      });
    }

    await writeLog({
      tenantId,
      status: failed > 0 ? "Warning" : "Success",
      message: `Network follow-up sweep: ${contacts.length} found, ${reminded} reminded, ${skipped} skipped, ${failed} failed.`,
      operationId,
      metadata: { total: contacts.length, reminded, skipped, failed, staleDays, durationMs },
    });

    logger.info({ tenantId, operationId, total: contacts.length, reminded, skipped, failed, durationMs }, "network follow-up sweep completed");

    return {
      moduleKey: "network-follow-up",
      operationId,
      status: failed > 0 ? "warning" : "completed",
      total: contacts.length,
      reminded,
      skipped,
      failed,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ tenantId, operationId, error: msg }, "network follow-up sweep failed");
    await writeLog({ tenantId, status: "Failed", message: `Sweep failed: ${msg}`, operationId });
    throw error;
  }
}
