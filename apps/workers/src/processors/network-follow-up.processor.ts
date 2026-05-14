import { AutomationLogModel, ContactModel, UserModel } from "@jobflow/database/models";
import {
  buildAnthropicModelCandidates,
  callAnthropicMessages,
  resolveAnthropicApiKey,
} from "@jobflow/integrations/ai/anthropic-messages";
import { sendResendEmail, isResendConfigured } from "@jobflow/integrations/email/resend.service";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";
import { redactForLog } from "../utils/worker-error";

const STALE_CONTACT_DAYS = 30; // Contacts not followed up in 30+ days

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
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logger.error({ err: e }, "failed to write network-follow-up automation log");
  }
}

async function generateFollowUpMessage(input: {
  contactName: string;
  contactRole?: string;
  contactCompany?: string;
  lastContacted?: Date;
  followUpReason?: string;
}): Promise<string | null> {
  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) return null;

  const daysSince = input.lastContacted
    ? Math.floor((Date.now() - input.lastContacted.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const modelCandidates = buildAnthropicModelCandidates();
  const prompt = [
    "Write a brief, natural networking follow-up message (3-4 sentences max).",
    "Tone: warm, professional, not salesy. No subject line needed, just the message body.",
    "",
    `Contact: ${input.contactName}`,
    input.contactRole ? `Role: ${input.contactRole}` : "",
    input.contactCompany ? `Company: ${input.contactCompany}` : "",
    daysSince != null ? `Last contacted: ${daysSince} days ago` : "",
    input.followUpReason ? `Reason: ${input.followUpReason}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 200, temperature: 0.5 });
    return result.ok ? result.text : null;
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

  logger.info({ tenantId, operationId }, "network follow-up sweep started");

  try {
    // Resolve owner info for email notification
    const owner = await UserModel.findOne({ tenantId, role: "Owner" }).select("email name").lean() as { email?: string; name?: string } | null;
    const ownerEmail = owner?.email ?? null;
    const canSendEmail = Boolean(ownerEmail && isResendConfigured());

    // Find warm contacts that need follow-up
    const contacts = await (ContactModel as unknown as { find: Function }).find({
      tenantId,
      archived: { $ne: true },
      reminderEnabled: true,
      $or: [
        // Contacts with overdue follow-up date
        { nextFollowUpDate: { $lte: now }, followUpStatus: { $in: ["Due", "Overdue", "Scheduled"] } },
        // Contacts not contacted in STALE_CONTACT_DAYS days and no follow-up date set
        { lastContacted: { $lte: daysAgo(now, STALE_CONTACT_DAYS) }, nextFollowUpDate: { $exists: false } },
      ],
    })
      .select("_id name email role company lastContacted nextFollowUpDate followUpReason followUpMessagePreview followUpStatus")
      .limit(30)
      .lean() as Array<Record<string, unknown>>;

    logger.info({ tenantId, operationId, count: contacts.length }, "network follow-up contacts found");

    let processed = 0;
    let reminded = 0;
    let skipped = 0;
    let failed = 0;
    const reminderSummaries: string[] = [];

    for (const contact of contacts) {
      try {
        const today = now.toISOString().slice(0, 10);
        const raw = (contact as Record<string, unknown>);
        // Skip if already reminded today
        const lastReminderDate = String(raw.lastNetworkFollowUpReminderDate ?? "");
        if (lastReminderDate === today) {
          skipped += 1;
          continue;
        }

        const contactName = String(raw.name ?? "Contact");
        const contactEmail = raw.email ? String(raw.email) : null;

        // Generate follow-up message suggestion using Claude
        const suggestion =
          (raw.followUpMessagePreview ? String(raw.followUpMessagePreview) : null) ??
          (await generateFollowUpMessage({
            contactName,
            contactRole: raw.role ? String(raw.role) : undefined,
            contactCompany: raw.company ? String(raw.company) : undefined,
            lastContacted: raw.lastContacted ? new Date(String(raw.lastContacted)) : undefined,
            followUpReason: raw.followUpReason ? String(raw.followUpReason) : undefined,
          }));

        // Notify owner (not auto-send to recruiter)
        if (canSendEmail && ownerEmail) {
          const subject = `Network follow-up reminder: ${contactName}${raw.company ? ` at ${raw.company}` : ""}`;
          const html = [
            `<h3>Network Follow-Up Reminder</h3>`,
            `<p><strong>${contactName}</strong>${raw.role ? ` — ${raw.role}` : ""}${raw.company ? ` at ${raw.company}` : ""}</p>`,
            contactEmail ? `<p>Email: ${contactEmail}</p>` : "",
            suggestion ? `<hr/><p><strong>Suggested message:</strong></p><p>${suggestion.replace(/\n/g, "<br/>")}</p>` : "",
          ].join("");
          const text = `Follow-up reminder for ${contactName}${suggestion ? `\n\n${suggestion}` : ""}`;
          await sendResendEmail({ to: ownerEmail, subject, html, text });
        }

        // Mark reminder sent
        await (ContactModel as unknown as { findByIdAndUpdate: Function }).findByIdAndUpdate(contact._id, {
          $set: { lastNetworkFollowUpReminderDate: today },
          followUpStatus: "Reminded",
        });

        reminderSummaries.push(`${contactName}${raw.company ? ` (${raw.company})` : ""}`);
        reminded += 1;
        processed += 1;
      } catch (error) {
        failed += 1;
        logger.warn({ tenantId, operationId, contactId: String(contact._id), error: redactForLog(error instanceof Error ? error.message : "Unknown") }, "network follow-up failed for contact");
      }
    }

    skipped += contacts.length - processed - failed;

    const durationMs = Date.now() - started;

    if (reminded > 0) {
      await notifyAutomationEvent({
        tenantId,
        moduleKey: "network-follow-up",
        event: "network-reminder",
        message: `🤝 ${reminded} network follow-up reminder${reminded !== 1 ? "s" : ""}: ${reminderSummaries.slice(0, 5).join(", ")}${reminded > 5 ? "..." : ""}`,
        operationId,
        metadata: { reminded, skipped, failed, durationMs },
      });
    }

    await writeLog({
      tenantId,
      status: failed > 0 ? "Warning" : "Success",
      message: `Network follow-up sweep: ${contacts.length} found, ${reminded} reminded, ${skipped} skipped, ${failed} failed.`,
      operationId,
      metadata: { total: contacts.length, reminded, skipped, failed, emailEnabled: canSendEmail, durationMs },
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
