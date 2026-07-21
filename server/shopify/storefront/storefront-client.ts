import { env } from "../../config/env";
import { HttpError } from "../../utils/http-error";

export async function shopifyStorefrontGraphQL<T>(query: string, variables: Record<string, unknown>) {
  if (!env.SHOPIFY_STOREFRONT_ACCESS_TOKEN) {
    throw new HttpError(500, "SHOPIFY_STOREFRONT_ACCESS_TOKEN is not configured");
  }

  const response = await fetch(
    `https://${env.SHOPIFY_SHOP_DOMAIN}/api/${env.SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!response.ok) {
    throw new HttpError(response.status, "Shopify Storefront API request failed", {
      statusText: response.statusText,
    });
  }

  return (await response.json()) as T;
}
