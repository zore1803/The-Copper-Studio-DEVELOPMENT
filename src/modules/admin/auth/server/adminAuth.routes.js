import { Router } from "express";
import { login, me } from "./adminAuth.controller.js";
import { requireAdmin } from "./requireAdmin.js";

const adminAuthRoutes = Router();

adminAuthRoutes.post("/login", login);
adminAuthRoutes.get("/me", requireAdmin, me);

export { adminAuthRoutes };
