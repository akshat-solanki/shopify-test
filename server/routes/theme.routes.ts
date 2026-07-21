import { Router } from "express";
import { bootstrapShowcaseController, listThemesController } from "../controllers/theme.controller";
import { asyncHandler } from "../utils/async-handler";

export const themeRouter = Router();

themeRouter.get("/themes", asyncHandler(listThemesController));
themeRouter.post("/showcase/bootstrap", asyncHandler(bootstrapShowcaseController));
