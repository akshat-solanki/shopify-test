import type { ProductProjectionDto } from "../../shared/contracts";
import { env } from "../config/env";
import { adminProductsQuery } from "../shopify/admin/queries";
import { normalizeAdminProducts } from "../shopify/admin/product-normalizer";
import { shopifyAdminGraphQL } from "../shopify/admin/admin-client";

type AdminProductsPayload = {
  products: {
    nodes: Array<Record<string, unknown>>;
  };
};

export async function getProductCatalog(
  limit = env.SHOPIFY_PRODUCT_LIMIT,
  query = env.SHOPIFY_PRODUCT_QUERY,
  shop?: string,
) {
  const data = await shopifyAdminGraphQL<AdminProductsPayload>(adminProductsQuery, {
    first: limit,
    query,
  }, { shop });

  return normalizeAdminProducts(data) satisfies ProductProjectionDto[];
}
