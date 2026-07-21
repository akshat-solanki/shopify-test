import { Router } from "express";
import {
  getShowcaseInstanceController,
  getShowcaseRuntimeController,
  listShowcaseInstancesController,
  updateShowcaseConfigurationController,
  updateShowcaseSourceController,
} from "../controllers/showcase.controller";
import { asyncHandler } from "../utils/async-handler";

export const showcaseRouter = Router();

showcaseRouter.get("/instances", asyncHandler(listShowcaseInstancesController));
showcaseRouter.get("/instances/:instanceId", asyncHandler(getShowcaseInstanceController));
showcaseRouter.patch("/instances/:instanceId/configuration", asyncHandler(updateShowcaseConfigurationController));
showcaseRouter.patch("/instances/:instanceId/source", asyncHandler(updateShowcaseSourceController));
showcaseRouter.get("/instances/:instanceId/runtime", asyncHandler(getShowcaseRuntimeController));
