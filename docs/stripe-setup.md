# Stripe Billing Setup

JobFlow uses **Stripe Checkout** for subscriptions and the **Stripe Customer Portal** for payment method updates and invoices.

## 1. Stripe Dashboard

1. Create products/prices for **Starter**, **Pro**, and **Agency** (monthly and yearly).
2. Enable the **Customer Portal** (Billing → Customer portal).
3. Create a webhook endpoint pointing to your API:

   ```
   POST https://<your-api-host>/billing/webhook
   ```

4. Subscribe to these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`

## 2. Environment variables

Set on the **API** service (Railway, etc.):

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from the webhook (`whsec_...`) |
| `APP_BASE_URL` | Public web app URL (e.g. `https://jobautomation-production.up.railway.app`) |
| `STRIPE_PRICE_PLUS` | Monthly Plus price ID (€9.99) |
| `STRIPE_PRICE_PLUS_YEARLY` | Yearly Plus price ID (€99) |
| `STRIPE_PRICE_PRO` | Monthly Pro price ID (€19.99) |
| `STRIPE_PRICE_PRO_YEARLY` | Yearly Pro price ID (€199) |
| `STRIPE_PRICE_EXECUTIVE` | Monthly Executive price ID (€39.99) |
| `STRIPE_PRICE_EXECUTIVE_YEARLY` | Yearly Executive price ID (€399) |
| `STRIPE_PRICE_FOUNDING_PRO_YEARLY` | Founding Member Pro first year (€99) |
| `STRIPE_PRICE_AI_CREDITS_50` | One-time 50 AI credits (€4.99) |
| `STRIPE_PRICE_AI_CREDITS_150` | One-time 150 AI credits (€9.99) |

Optional on **web** (for future Stripe.js embeds):

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable key (`pk_...`) |

Dev-only bypass (do **not** set in production):

| Variable | Description |
|----------|-------------|
| `ALLOW_DIRECT_PLAN_CHANGE=true` | Allows `POST /billing/change-plan` without Stripe |

## 3. Customer flow

1. User opens **Settings → Billing**.
2. Chooses a plan (monthly/yearly) → **Upgrade** → redirected to Stripe Checkout.
3. After payment, Stripe redirects to `/settings?section=Billing&checkout=success`.
4. Webhook `checkout.session.completed` activates the plan and syncs limits.
5. **Manage billing** opens the Stripe Customer Portal (invoices, card, cancel).

## 4. API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/billing/plan` | Yes | Plan, usage, catalog, `stripeConfigured` |
| POST | `/billing/checkout` | Yes | `{ planKey, billingCycle }` → `checkoutUrl` |
| POST | `/billing/portal` | Yes | Customer portal URL |
| POST | `/billing/cancel` | Yes | Schedule cancel at period end |
| POST | `/billing/webhook` | No (signed) | Stripe events |

## 5. Verify locally

Use [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhooks:

```bash
stripe listen --forward-to localhost:4000/billing/webhook
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`, set test price IDs, then:

1. Log in to the web app.
2. Settings → Billing → Upgrade.
3. Complete test checkout (`4242...` card).
4. Confirm `GET /billing/plan` shows the new plan and limits.
