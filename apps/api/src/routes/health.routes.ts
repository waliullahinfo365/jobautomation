import { Router } from "express";
import { healthLive, healthReady, healthSummary } from "../controllers/health.controller";

export const healthRoutes = Router();
healthRoutes.get("/health", healthSummary);
healthRoutes.get("/health/live", healthLive);
healthRoutes.get("/health/ready", healthReady);
