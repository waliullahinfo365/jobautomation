import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { successResponse } from "../utils/apiResponse";

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.registerUser({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    workspaceName: req.body.workspaceName,
    req,
  });
  return successResponse(res, result, "Registered", 201);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.loginUser({
    email: req.body.email,
    password: req.body.password,
    req,
  });
  return successResponse(res, result, "Logged in");
});

export const logoutHandler = asyncHandler(async (_req: Request, res: Response) => {
  const result = await authService.logoutUser();
  return successResponse(res, result, "Logged out");
});

export const meHandler = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const tenantId = req.user?.tenantId;
  if (!userId || !tenantId) {
    return res.status(401).json({ success: false, error: { message: "Unauthorized", code: "UNAUTHORIZED" } });
  }
  const result = await authService.getCurrentUser({ userId, tenantId });
  return successResponse(res, result, "Current user");
});
