import type { Request, Response } from "express";
import { productCatalogQuerySchema } from "../../shared/schemas/catalog";
import { env } from "../config/env";
import { getProductCatalog } from "../services/product-catalog.service";

export async function listProductsController(request: Request, response: Response) {
  const input = productCatalogQuerySchema.parse(request.query);
  const products = await getProductCatalog(
    input.limit ?? env.SHOPIFY_PRODUCT_LIMIT,
    input.query ?? env.SHOPIFY_PRODUCT_QUERY,
    input.shop,
  );

  response.json({
    data: products,
    meta: {
      timestamp: new Date().toISOString(),
      version: env.SHOPIFY_API_VERSION,
      shop: input.shop ?? env.SHOPIFY_SHOP_DOMAIN ?? null,
    },
  });
}
