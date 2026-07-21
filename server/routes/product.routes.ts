import { Router } from "express";
import { listProductsController } from "../controllers/product.controller";
import { asyncHandler } from "../utils/async-handler";

export const productRouter = Router();

productRouter.get("/", asyncHandler(listProductsController));
