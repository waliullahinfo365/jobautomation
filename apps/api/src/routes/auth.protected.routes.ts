import { Router } from "express";
import { validateBody } from "../middleware/validate.middleware";
import {
  logoutHandler,
  meHandler,
  getPreferencesHandler,
  updatePreferencesHandler,
  updateProfileHandler,
  uploadAvatarHandler,
  removeAvatarHandler,
  changePasswordHandler,
} from "../controllers/auth.controller";
import {
  changePasswordBodySchema,
  updateProfileBodySchema,
  uploadAvatarBodySchema,
} from "../validators/auth.validator";

export const authProtectedRoutes = Router();

authProtectedRoutes.get("/me", meHandler);
authProtectedRoutes.patch("/me", validateBody(updateProfileBodySchema), updateProfileHandler);
authProtectedRoutes.post("/me/avatar", validateBody(uploadAvatarBodySchema), uploadAvatarHandler);
authProtectedRoutes.delete("/me/avatar", removeAvatarHandler);
authProtectedRoutes.post("/change-password", validateBody(changePasswordBodySchema), changePasswordHandler);
authProtectedRoutes.post("/logout", logoutHandler);
authProtectedRoutes.get("/me/preferences", getPreferencesHandler);
authProtectedRoutes.patch("/me/preferences", updatePreferencesHandler);
