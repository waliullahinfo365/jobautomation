/**
 * Web Push (VAPID) helpers for mobile lock-screen notifications.
 */
import { PushSubscriptionModel } from "@jobflow/database/models";

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.VAPID_SUBJECT?.trim() || "mailto:support@newjob.guru";
  if (!publicKey || !privateKey) return false;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webpush = require("web-push") as typeof import("web-push");
  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

export async function savePushSubscription(input: {
  tenantId: string;
  userId: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}) {
  await PushSubscriptionModel.findOneAndUpdate(
    { endpoint: input.endpoint },
    {
      tenantId: input.tenantId,
      userId: input.userId,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent,
      updatedBy: input.userId,
      createdBy: input.userId,
    },
    { upsert: true, new: true }
  );
}

export async function removePushSubscription(input: { tenantId: string; userId: string; endpoint: string }) {
  await PushSubscriptionModel.deleteOne({
    tenantId: input.tenantId,
    userId: input.userId,
    endpoint: input.endpoint,
  });
}

export async function sendPushToUser(input: {
  tenantId: string;
  userId?: string;
  title: string;
  body: string;
  url?: string;
}): Promise<{ sent: number; failed: number }> {
  if (!ensureVapid()) return { sent: 0, failed: 0 };

  const filter: Record<string, unknown> = { tenantId: input.tenantId };
  if (input.userId) filter.userId = input.userId;

  const subs = await PushSubscriptionModel.find(filter).lean();
  let sent = 0;
  let failed = 0;

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    url: input.url ?? "/apply-assistant",
  });

  for (const sub of subs) {
    const row = sub as Record<string, unknown>;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const webpush = require("web-push") as typeof import("web-push");
      await webpush.sendNotification(
        {
          endpoint: String(row.endpoint),
          keys: { p256dh: String(row.p256dh), auth: String(row.auth) },
        },
        payload
      );
      sent++;
    } catch (err) {
      failed++;
      const status = err && typeof err === "object" && "statusCode" in err ? (err as { statusCode: number }).statusCode : 0;
      if (status === 404 || status === 410) {
        await PushSubscriptionModel.deleteOne({ endpoint: row.endpoint }).catch(() => void 0);
      }
    }
  }

  return { sent, failed };
}
