import { ApplicationModel, AutomationLogModel, JobModel, NotificationModel } from "@jobflow/database/models";
import {
  buildAnthropicModelCandidates,
  callAnthropicMessages,
  resolveAnthropicApiKey,
} from "@jobflow/integrations/ai/anthropic-messages";
import { notifyAutomationEvent } from "../lib/notifications";
import { logger } from "../utils/logger";
import { redactForLog } from "../utils/worker-error";

type OfferStage = "discussion" | "verbal_offer" | "written_offer" | "negotiation" | "not_offer";

interface OfferClassification {
  is_offer_related: boolean;
  confidence: number;
  offer_stage: OfferStage;
  summary: string;
  next_action: string;
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
      moduleKey: "offer-tracking",
      moduleName: "Offer Tracking",
      status: input.status,
      message: input.message,
      operationId: input.operationId,
      relatedRecordType: input.relatedRecordId ? "Application" : undefined,
      relatedRecordId: input.relatedRecordId,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logger.error({ err: e }, "failed to write offer-tracking automation log");
  }
}

/** Rule-based pre-filter: returns true if the email/reply might be offer-related. */
function mightBeOffer(text: string): boolean {
  const lower = text.toLowerCase();
  const offerKeywords = [
    "offer", "compensation", "package", "salary", "contract", "start date",
    "sign", "accept", "reject offer", "negotiat", "we would like to extend",
    "pleased to offer", "formal offer", "job offer",
  ];
  const nonOfferKeywords = [
    "we offer services", "offer a discount", "special offer", "promotional offer",
    "limited time offer", "exclusive offer",
  ];
  if (nonOfferKeywords.some((k) => lower.includes(k))) return false;
  return offerKeywords.some((k) => lower.includes(k));
}

async function classifyOfferWithClaude(input: {
  subject: string;
  bodyText: string;
  company: string;
  position: string;
}): Promise<OfferClassification | null> {
  const apiKey = resolveAnthropicApiKey();
  if (!apiKey) return null;

  const modelCandidates = buildAnthropicModelCandidates();
  const prompt = [
    "Classify whether this email/message is related to a job offer. Return ONLY valid JSON.",
    "",
    "JSON shape:",
    '{"is_offer_related": boolean, "confidence": 0.0-1.0, "offer_stage": "discussion"|"verbal_offer"|"written_offer"|"negotiation"|"not_offer", "summary": "1-2 sentences", "next_action": "string"}',
    "",
    "Rules:",
    "- is_offer_related: true only for real compensation/offer discussions",
    "- NOT for: newsletters, service offers, promotional emails, automated rejection notices",
    "- offer_stage: 'discussion' = early compensation talk; 'verbal_offer' = verbal/informal offer; 'written_offer' = formal offer letter; 'negotiation' = negotiating terms; 'not_offer' = not an offer",
    "- confidence < 0.75 → is_offer_related should be false",
    "",
    `Company: ${input.company}`,
    `Position: ${input.position}`,
    `Subject: ${input.subject}`,
    `Body:\n${input.bodyText.slice(0, 1500)}`,
  ].join("\n");

  try {
    const result = await callAnthropicMessages({ prompt, apiKey, modelCandidates, maxTokens: 300, temperature: 0.1 });
    if (!result.ok) return null;

    const fenceMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const raw = fenceMatch ? fenceMatch[1] : result.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as OfferClassification;
  } catch {
    return null;
  }
}

export async function processOfferTrackingJob(payload: {
  tenantId: string;
  operationId?: string;
  date?: string;
}) {
  const started = Date.now();
  const operationId = payload.operationId ?? `offer-tracking-${Date.now()}`;
  const tenantId = payload.tenantId;
  const today = (payload.date ? new Date(payload.date) : new Date()).toISOString().slice(0, 10);

  logger.info({ tenantId, operationId }, "offer tracking sweep started");

  try {
    // Find applications with potential offer signals that haven't been processed today
    const candidates = await ApplicationModel.find({
      tenantId,
      applicationStatus: { $in: ["Applied", "Interview", "Replied"] },
      responseStatus: { $in: ["Positive Reply", "Needs Review"] },
      lastReplySnippet: { $exists: true, $ne: "" },
      // Skip apps already processed today with this key pattern
      offerDetectionKey: { $not: { $regex: `^offer-detection:${tenantId}:.*:${today}$` } },
    })
      .select("_id company position lastEmailSubject lastReplySnippet applicationStatus jobId offerDetectionKey")
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean() as Array<Record<string, unknown>>;

    logger.info({ tenantId, operationId, count: candidates.length }, "offer tracking candidates found");

    let detected = 0;
    let skipped = 0;
    let failed = 0;

    for (const app of candidates) {
      const appId = String(app._id);
      try {
        const subject = String(app.lastEmailSubject ?? "");
        const bodyText = String(app.lastReplySnippet ?? "");
        const combined = `${subject} ${bodyText}`;

        // Pre-filter: skip if clearly not offer-related
        if (!mightBeOffer(combined)) {
          skipped += 1;
          continue;
        }

        // Claude classification
        const classification = await classifyOfferWithClaude({
          subject,
          bodyText,
          company: String(app.company ?? ""),
          position: String(app.position ?? ""),
        });

        const detectionKey = `offer-detection:${tenantId}:${appId}:${today}`;

        if (!classification || !classification.is_offer_related || classification.confidence < 0.75) {
          // Mark as checked today even on no-offer result to avoid re-processing
          await ApplicationModel.findByIdAndUpdate(appId, {
            offerDetectionKey: detectionKey,
            $unset: { offerDetectionError: 1 },
          });
          skipped += 1;
          continue;
        }

        logger.info(
          { tenantId, operationId, applicationId: appId, stage: classification.offer_stage, confidence: classification.confidence },
          "offer signal detected"
        );

        const isHighConfidence = classification.confidence >= 0.85;
        const isFormalOffer = ["written_offer", "verbal_offer"].includes(classification.offer_stage);
        const offerNow = new Date();

        // Build update: always save offer details; promote status only for high-confidence formal offers
        const appUpdate: Record<string, unknown> = {
          offerDetectionKey: detectionKey,
          offerDetectedAt: offerNow,
          offerStage: classification.offer_stage,
          offerSummary: redactForLog(classification.summary, 500),
          offerNextAction: classification.next_action,
          offerConfidence: classification.confidence,
          aiClassification: `offer:${classification.offer_stage}`,
          $unset: { offerDetectionError: 1 },
        };

        if (isHighConfidence && isFormalOffer) {
          (appUpdate as any).applicationStatus = "Offer";
          (appUpdate as any).lastStatusChangedAt = offerNow;
        } else if (classification.offer_stage === "discussion" || classification.offer_stage === "negotiation") {
          // Lower-confidence: mark as Offer Discussion without full status change
          (appUpdate as any).responseStatus = "Positive Reply";
        }

        await ApplicationModel.findByIdAndUpdate(appId, appUpdate);

        // Sync job status for formal high-confidence offers
        if (isHighConfidence && isFormalOffer) {
          const jobId = String(app.jobId ?? "");
          if (jobId) {
            const job = await JobModel.findOne({ _id: jobId, tenantId }).select("status").lean() as { status?: string } | null;
            if (job && !["Offer", "Rejected", "Archived"].includes(job.status ?? "")) {
              await JobModel.findByIdAndUpdate(jobId, { status: "Offer", lastStatusChangedAt: offerNow });
            }
          }
        }

        // In-app bell notification
        const severity = isFormalOffer ? "success" : "info";
        const stageLabel: Record<OfferStage, string> = {
          written_offer: "Written offer received",
          verbal_offer: "Verbal offer received",
          negotiation: "Offer negotiation in progress",
          discussion: "Offer discussion started",
          not_offer: "Offer signal",
        };
        try {
          await NotificationModel.create({
            tenantId,
            createdBy: "system",
            moduleKey: "offer-tracking",
            type: "offer_detected",
            title: `${stageLabel[classification.offer_stage]} — ${app.company}`,
            message: `${app.position}: ${classification.summary}. Next: ${classification.next_action}`,
            severity,
            relatedRecordType: "Application",
            relatedRecordId: appId,
            actionUrl: `/applications`,
            read: false,
          });
        } catch (e) {
          logger.warn({ err: e }, "offer-tracking: failed to create in-app notification");
        }

        await writeLog({
          tenantId,
          status: "Success",
          message: `Offer signal (${classification.offer_stage}, ${Math.round(classification.confidence * 100)}%) at ${app.company} — ${app.position}: ${redactForLog(classification.summary, 200)}`,
          operationId,
          relatedRecordId: appId,
          metadata: {
            stage: classification.offer_stage,
            confidence: classification.confidence,
            autoUpdated: isHighConfidence && isFormalOffer,
            nextAction: classification.next_action,
          },
        });

        await notifyAutomationEvent({
          tenantId,
          moduleKey: "offer-tracking",
          event: "offer-received",
          message: `Offer signal detected at ${app.company} — ${app.position}!\nStage: ${classification.offer_stage}\nNext: ${classification.next_action}`,
          operationId,
          metadata: { applicationId: appId, stage: classification.offer_stage, confidence: classification.confidence },
        });

        detected += 1;
      } catch (error) {
        failed += 1;
        const msg = error instanceof Error ? error.message : "Unknown";
        logger.warn({ tenantId, operationId, applicationId: appId, error: msg }, "offer tracking failed for application");
        try {
          await ApplicationModel.findByIdAndUpdate(appId, { offerDetectionError: msg });
        } catch { /* swallow */ }
      }
    }

    const durationMs = Date.now() - started;

    await writeLog({
      tenantId,
      status: failed > 0 ? "Warning" : "Success",
      message: `Offer tracking sweep: ${candidates.length} scanned, ${detected} detected, ${skipped} skipped, ${failed} failed.`,
      operationId,
      metadata: { scanned: candidates.length, detected, skipped, failed, durationMs },
    });

    logger.info({ tenantId, operationId, scanned: candidates.length, detected, skipped, failed, durationMs }, "offer tracking sweep completed");

    return {
      moduleKey: "offer-tracking",
      operationId,
      status: failed > 0 ? "warning" : "completed",
      scanned: candidates.length,
      detected,
      skipped,
      failed,
      durationMs,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ tenantId, operationId, error: msg }, "offer tracking sweep failed");
    await writeLog({ tenantId, status: "Failed", message: `Sweep failed: ${msg}`, operationId });
    throw error;
  }
}
