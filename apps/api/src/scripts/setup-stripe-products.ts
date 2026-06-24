/**
 * Create Stripe products, prices, and webhook for NewJob Guru billing.
 *
 * Usage (loads root `.env` via dotenv-cli):
 *   pnpm stripe:setup
 *
 * Required in `.env` (NOT `.env.example`):
 *   STRIPE_SECRET_KEY=sk_test_...
 *
 * Optional:
 *   APP_BASE_URL=https://jobautomation-production.up.railway.app
 *   STRIPE_WEBHOOK_URL=https://jobautomation-production.up.railway.app/billing/webhook
 */
const STRIPE_API = "https://api.stripe.com/v1";

type StripeList<T> = { data: T[] };

async function stripe<T>(method: "GET" | "POST", path: string, body?: Record<string, string>): Promise<T> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is missing. Add it to a root `.env` file (copy from .env.example), then run: pnpm stripe:setup"
    );
  }

  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2023-10-16",
    },
    ...(body ? { body: new URLSearchParams(body).toString() } : {}),
  });

  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = (json.error as { message?: string } | undefined)?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

async function findProductByName(name: string) {
  const list = await stripe<StripeList<{ id: string; name: string }>>("GET", "/products?active=true&limit=100");
  return list.data.find((p) => p.name === name) ?? null;
}

async function ensureProduct(name: string, description: string) {
  const existing = await findProductByName(name);
  if (existing) return existing.id;
  const created = await stripe<{ id: string }>("POST", "/products", {
    name,
    description,
    "metadata[app]": "newjob-guru",
  });
  return created.id;
}

async function ensurePrice(input: {
  productId: string;
  unitAmountCents: number;
  currency: string;
  interval?: "month" | "year";
  nickname: string;
}) {
  const list = await stripe<StripeList<{ id: string; nickname: string | null }>>(
    "GET",
    `/prices?product=${input.productId}&active=true&limit=100`
  );
  const existing = list.data.find((p) => p.nickname === input.nickname);
  if (existing) return existing.id;

  const body: Record<string, string> = {
    product: input.productId,
    unit_amount: String(input.unitAmountCents),
    currency: input.currency,
    nickname: input.nickname,
  };
  if (input.interval) {
    body["recurring[interval]"] = input.interval;
  }
  const created = await stripe<{ id: string }>("POST", "/prices", body);
  return created.id;
}

async function ensureWebhook(url: string) {
  const list = await stripe<StripeList<{ id: string; url: string; secret?: string }>>("GET", "/webhook_endpoints?limit=100");
  const existing = list.data.find((w) => w.url === url);
  if (existing) {
    return { id: existing.id, secret: existing.secret ?? "(existing — copy secret from Stripe Dashboard)" };
  }

  const events = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_succeeded",
    "invoice.payment_failed",
    "customer.subscription.trial_will_end",
  ];

  const body: Record<string, string> = {
    url,
    description: "NewJob Guru billing",
    "metadata[app]": "newjob-guru",
  };
  events.forEach((event, i) => {
    body[`enabled_events[${i}]`] = event;
  });

  const created = await stripe<{ id: string; secret: string }>("POST", "/webhook_endpoints", body);
  return { id: created.id, secret: created.secret };
}

async function main() {
  const appBaseUrl = (process.env.WEB_APP_URL ?? process.env.APP_BASE_URL ?? "https://newjob.guru").replace(/\/$/, "");
  const webhookUrl = (process.env.STRIPE_WEBHOOK_URL ?? `${appBaseUrl.replace(/\/$/, "")}/billing/webhook`).replace(
    /\/$/,
    ""
  );

  console.log("Creating Stripe products & prices (EUR)...\n");

  const plusId = await ensureProduct("Plus", "For active job seekers — organize and apply faster.");
  const proId = await ensureProduct("Pro", "Full AI job search assistant.");
  const executiveId = await ensureProduct("Executive", "High-volume applications and senior roles.");
  const foundingId = await ensureProduct("Founding Member Pro", "Launch offer — Pro features, first year €99.");
  const credits50Id = await ensureProduct("AI Credits 50", "50 extra AI credits (one-time).");
  const credits150Id = await ensureProduct("AI Credits 150", "150 extra AI credits (one-time).");

  const prices = {
    STRIPE_PRICE_PLUS: await ensurePrice({ productId: plusId, unitAmountCents: 999, currency: "eur", interval: "month", nickname: "plus_monthly" }),
    STRIPE_PRICE_PLUS_YEARLY: await ensurePrice({ productId: plusId, unitAmountCents: 9900, currency: "eur", interval: "year", nickname: "plus_yearly" }),
    STRIPE_PRICE_PRO: await ensurePrice({ productId: proId, unitAmountCents: 1999, currency: "eur", interval: "month", nickname: "pro_monthly" }),
    STRIPE_PRICE_PRO_YEARLY: await ensurePrice({ productId: proId, unitAmountCents: 19900, currency: "eur", interval: "year", nickname: "pro_yearly" }),
    STRIPE_PRICE_EXECUTIVE: await ensurePrice({ productId: executiveId, unitAmountCents: 3999, currency: "eur", interval: "month", nickname: "executive_monthly" }),
    STRIPE_PRICE_EXECUTIVE_YEARLY: await ensurePrice({ productId: executiveId, unitAmountCents: 39900, currency: "eur", interval: "year", nickname: "executive_yearly" }),
    STRIPE_PRICE_FOUNDING_PRO_YEARLY: await ensurePrice({ productId: foundingId, unitAmountCents: 9900, currency: "eur", interval: "year", nickname: "founding_pro_yearly" }),
    STRIPE_PRICE_AI_CREDITS_50: await ensurePrice({ productId: credits50Id, unitAmountCents: 499, currency: "eur", nickname: "ai_credits_50" }),
    STRIPE_PRICE_AI_CREDITS_150: await ensurePrice({ productId: credits150Id, unitAmountCents: 999, currency: "eur", nickname: "ai_credits_150" }),
  };

  console.log("Creating webhook endpoint...");
  const webhook = await ensureWebhook(webhookUrl);

  console.log("\n=== Copy these to Railway (API service) ===\n");
  console.log(`STRIPE_SECRET_KEY=${process.env.STRIPE_SECRET_KEY}`);
  console.log(`APP_BASE_URL=${appBaseUrl}`);
  console.log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`);
  for (const [key, value] of Object.entries(prices)) {
    console.log(`${key}=${value}`);
  }

  console.log("\n=== Also enable in Stripe Dashboard ===");
  console.log("1. Settings → Customer portal → Enable");
  console.log("2. Settings → Tax → Stripe Tax (optional, for EU VAT)");
  console.log("3. Test checkout with card 4242 4242 4242 4242");
  console.log(`\nWebhook endpoint: ${webhookUrl}`);
  console.log(`Webhook id: ${webhook.id}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
