import { Router } from "express";
import {
  getPlan,
  getUsage,
  getFeatureGatesHandler,
  postBillingPortal,
  postCancel,
  postChangePlan,
  postCheckout,
  postCreditsCheckout,
  postRecalculateUsage,
} from "../controllers/billing.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody } from "../middleware/validate.middleware";
import {
  billingChangePlanBodySchema,
  billingCheckoutBodySchema,
  billingCreditsCheckoutBodySchema,
} from "../validators/billing.validator";

export const billingRoutes = Router();

billingRoutes.get("/plan", requirePermission("billing.read"), getPlan);
billingRoutes.get("/feature-gates", requirePermission("billing.read"), getFeatureGatesHandler);
billingRoutes.post("/checkout", requirePermission("billing.update"), validateBody(billingCheckoutBodySchema), postCheckout);
billingRoutes.post("/checkout/credits", requirePermission("billing.update"), validateBody(billingCreditsCheckoutBodySchema), postCreditsCheckout);
billingRoutes.post("/change-plan", requirePermission("billing.update"), validateBody(billingChangePlanBodySchema), postChangePlan);
billingRoutes.post("/cancel", requirePermission("billing.update"), postCancel);
billingRoutes.post("/portal", requirePermission("billing.update"), postBillingPortal);
billingRoutes.get("/usage", requirePermission("billing.read"), getUsage);
billingRoutes.post("/recalculate-usage", requirePermission("billing.update"), postRecalculateUsage);
