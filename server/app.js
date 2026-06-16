import express from "express";
import cors from "cors";
import { adminRoutes } from "../src/modules/admin/server/routes/index.js";
import { models as defaultModels } from "./models/index.js";

function createApp({ models: injectedModels = defaultModels } = {}) {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.locals.models = injectedModels;

  app.get("/api/health", (request, response) => {
    response.status(200).json({ ok: true, service: "the-copper-studio" });
  });

  app.use("/api/admin", adminRoutes);

  return app;
}

export { createApp };
