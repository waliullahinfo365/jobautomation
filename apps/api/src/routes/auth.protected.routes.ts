import { Router } from "express";
import { validateBody } from "../middleware/validate.middleware";
import {
  logoutHandler,
  meHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
  updateProfileHandler,
  changePasswordHandler,
} from "../controllers/auth.controller";
import { changePasswordBodySchema, updateProfileBodySchema } from "../validators/auth.validator";

export const authProtectedRoutes = Router();

authProtectedRoutes.get("/me", meHandler);
authProtectedRoutes.patch("/me", validateBody(updateProfileBodySchema), updateProfileHandler);
authProtectedRoutes.post("/change-password", validateBody(changePasswordBodySchema), changePasswordHandler);
authProtectedRoutes.post("/logout", logoutHandler);
authProtectedRoutes.get("/me/preferences", getPreferencesHandler);
authProtectedRoutes.patch("/me/preferences", updatePreferencesHandler);
