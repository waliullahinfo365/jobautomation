import { Router } from "express";
import { logoutHandler, meHandler } from "../controllers/auth.controller";

export const authProtectedRoutes = Router();

authProtectedRoutes.get("/me", meHandler);
authProtectedRoutes.post("/logout", logoutHandler);
