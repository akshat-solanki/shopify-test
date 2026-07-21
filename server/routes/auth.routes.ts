import { Router } from "express";
import { authCallbackController, beginAuthController } from "../controllers/auth.controller";
import { asyncHandler } from "../utils/async-handler";

export const authRouter = Router();

authRouter.get("/", asyncHandler(async (request, response) => beginAuthController(request, response)));
authRouter.get("/callback", asyncHandler(authCallbackController));
