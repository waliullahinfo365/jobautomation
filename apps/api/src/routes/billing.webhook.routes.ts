import { Router } from "express";
import { postWebhook } from "../controllers/billing.controller";
import { validateBody } from "../middleware/validate.middleware";
import { billingWebhookBodySchema } from "../validators/billing.validator";

export const billingWebhookRoutes = Router();
billingWebhookRoutes.post("/webhook", validateBody(billingWebhookBodySchema), postWebhook);
