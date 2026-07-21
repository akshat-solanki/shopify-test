import { env } from "../../config/env";
import { resolveShopAccess } from "../oauth/oauth.service";
import { HttpError } from "../../utils/http-error";

export interface ShopifyAdminGraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function shopifyAdminGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  options?: { shop?: string },
) {
  const { shop, accessToken } = await resolveShopAccess(options?.shop);
  const response = await fetch(
    `https://${shop}/admin/api/${env.SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!response.ok) {
    throw new HttpError(response.status, "Shopify Admin API request failed", {
      statusText: response.statusText,
    });
  }

  const payload = (await response.json()) as ShopifyAdminGraphQLResponse<T>;
  if (payload.errors?.length) {
    throw new HttpError(502, "Shopify Admin API returned GraphQL errors", {
      errors: payload.errors,
    });
  }

  if (!payload.data) {
    throw new HttpError(502, "Shopify Admin API returned an empty response");
  }

  return payload.data;
}
