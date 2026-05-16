import { Router } from "express";
import {
  getPlan,
  getUsage,
  postBillingPortal,
  postCancel,
  postChangePlan,
  postCheckout,
  postRecalculateUsage,
} from "../controllers/billing.controller";
import { requirePermission } from "../middleware/rbac.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { billingChangePlanBodySchema, billingCheckoutBodySchema } from "../validators/billing.validator";

export const billingRoutes = Router();

billingRoutes.get("/plan", requirePermission("billing.read"), getPlan);
billingRoutes.post("/checkout", requirePermission("billing.update"), validateBody(billingCheckoutBodySchema), postCheckout);
billingRoutes.post("/change-plan", requirePermission("billing.update"), validateBody(billingChangePlanBodySchema), postChangePlan);
billingRoutes.post("/cancel", requirePermission("billing.update"), postCancel);
billingRoutes.post("/portal", requirePermission("billing.update"), postBillingPortal);
billingRoutes.get("/usage", requirePermission("billing.read"), getUsage);
billingRoutes.post("/recalculate-usage", requirePermission("billing.update"), postRecalculateUsage);
