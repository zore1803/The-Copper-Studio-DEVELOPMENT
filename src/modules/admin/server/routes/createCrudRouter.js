import { Router } from "express";
import { createCrudController } from "../controllers/createCrudController.js";
import { buildCrudService } from "../services/adminCrud.service.js";

function createCrudRouter(resourceName, repository, middlewares = []) {
  const router = Router();
  const service = buildCrudService(resourceName, repository);
  const controller = createCrudController(service);

  if (middlewares.length > 0) {
    router.use(...middlewares);
  }
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.put("/:id", controller.update);
  router.delete("/:id", controller.remove);

  return router;
}

export { createCrudRouter };
