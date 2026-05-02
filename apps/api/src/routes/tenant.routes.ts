import { Router } from "express";
import { getCurrentTenant, getTenantUsage, updateCurrentTenant } from "../controllers/tenant.controller";
import { requireAnyPermission } from "../middleware/rbac.middleware";

export const tenantRoutes = Router();

tenantRoutes.get("/current", requireAnyPermission(["tenant.read", "settings.read"]), getCurrentTenant);
tenantRoutes.patch("/current", requireAnyPermission(["tenant.update", "settings.update"]), updateCurrentTenant);
tenantRoutes.get("/usage", requireAnyPermission(["tenant.read", "settings.read"]), getTenantUsage);
