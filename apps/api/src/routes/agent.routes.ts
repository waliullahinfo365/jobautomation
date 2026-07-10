import { Router } from "express";
import {
  agentAuthMiddleware,
  createPairingCodeHandler,
  getAgentApplyQueueHandler,
  getAgentProfileHandler,
  getAgentStatusHandler,
  pairAgentHandler,
  postAgentApplyResultHandler,
  postAgentHeartbeatHandler,
} from "../controllers/apply-agent.controller";

export const agentPublicRoutes = Router();
agentPublicRoutes.post("/pair", pairAgentHandler);

export const agentProtectedRoutes = Router();
agentProtectedRoutes.use(agentAuthMiddleware);
agentProtectedRoutes.get("/profile", getAgentProfileHandler);
agentProtectedRoutes.get("/apply-queue", getAgentApplyQueueHandler);
agentProtectedRoutes.post("/apply-result", postAgentApplyResultHandler);
agentProtectedRoutes.post("/heartbeat", postAgentHeartbeatHandler);
