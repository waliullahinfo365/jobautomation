import { Router } from "express";
import { postWebhook } from "../controllers/billing.controller";

export const billingWebhookRoutes = Router();
// No Zod validation here — Stripe sends arbitrary event shapes and raw body must be preserved for HMAC verification
billingWebhookRoutes.post("/webhook", postWebhook);
