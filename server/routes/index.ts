import { Router } from "express";
import { healthController } from "../controllers/health.controller";
import { authRouter } from "./auth.routes";
import { productRouter } from "./product.routes";
import { showcaseRouter } from "./showcase.routes";
import { themeRouter } from "./theme.routes";

export const apiRouter = Router();

apiRouter.get("/health", healthController);
apiRouter.use("/auth", authRouter);
apiRouter.use("/products", productRouter);
apiRouter.use("/shopify", themeRouter);
apiRouter.use("/showcase", showcaseRouter);
