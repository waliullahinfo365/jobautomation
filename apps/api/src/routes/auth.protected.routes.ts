import { Router } from "express";
import { logoutHandler, meHandler, getPreferencesHandler, updatePreferencesHandler } from "../controllers/auth.controller";

export const authProtectedRoutes = Router();

authProtectedRoutes.get("/me", meHandler);
authProtectedRoutes.post("/logout", logoutHandler);
authProtectedRoutes.get("/me/preferences", getPreferencesHandler);
authProtectedRoutes.patch("/me/preferences", updatePreferencesHandler);
