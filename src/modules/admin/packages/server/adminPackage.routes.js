import { Router } from "express";
import { requireAdmin } from "../../auth/server/requireAdmin.js";
import { list, create, update, remove } from "./package.controller.js";

const adminPackageRoutes = Router();

adminPackageRoutes.use(requireAdmin);
adminPackageRoutes.get("/", list);
adminPackageRoutes.post("/", create);
adminPackageRoutes.put("/:id", update);
adminPackageRoutes.delete("/:id", remove);

export { adminPackageRoutes };
