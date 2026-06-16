import { Router } from "express";
import { authorizeAdminRole } from "../middleware/authorizeAdminRole.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { buildCrudService } from "../services/adminCrud.service.js";
import { createCrudController } from "../controllers/createCrudController.js";

const deliverableService = buildCrudService("deliverables");
const deliverableController = createCrudController(deliverableService);
const adminDeliverableRoutes = Router({ mergeParams: true });

adminDeliverableRoutes.use(requireAdmin);
adminDeliverableRoutes.use(authorizeAdminRole(["admin"]));
adminDeliverableRoutes.get("/", async (request, response) => {
  const data = await deliverableService.list({
    projectId: request.params.projectId,
    ...request.query,
  });

  return response.status(200).json(data);
});
adminDeliverableRoutes.post("/", async (request, response) => {
  const data = await deliverableService.create({
    ...request.body,
    projectId: request.params.projectId,
  });

  return response.status(201).json(data);
});
adminDeliverableRoutes.get("/:id", deliverableController.getById);
adminDeliverableRoutes.put("/:id", deliverableController.update);
adminDeliverableRoutes.delete("/:id", deliverableController.remove);

export { adminDeliverableRoutes };
