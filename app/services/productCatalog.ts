import type { ApiResponse, ProductProjectionDto } from "../../shared/contracts";

function resolveShopParam() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("shop");
}

export async function fetchProductCatalog(limit = 12) {
  const params = new URLSearchParams({
    limit: String(limit),
  });

  const shop = resolveShopParam();
  if (shop) {
    params.set("shop", shop);
  }

  const response = await fetch(`/api/products?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Product catalog request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ProductProjectionDto[]>;
  return payload.data;
}
