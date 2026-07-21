import { Router } from "express";
import { getShowcaseRuntimeController } from "../controllers/showcase.controller";
import { asyncHandler } from "../utils/async-handler";

export const proxyRouter = Router();

proxyRouter.get("/instances/:instanceId", asyncHandler(getShowcaseRuntimeController));
