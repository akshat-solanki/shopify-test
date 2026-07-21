import type { ApiResponse, ShopifyOnboardingBootstrapDto, ShopifyThemeSummary } from "../../shared/contracts";

function resolveShopParam() {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get("shop");
}

export async function fetchShopifyThemes() {
  const params = new URLSearchParams();
  const shop = resolveShopParam();

  if (shop) {
    params.set("shop", shop);
  }

  const response = await fetch(`/api/shopify/themes${params.size ? `?${params.toString()}` : ""}`);
  if (!response.ok) {
    throw new Error(`Theme request failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ShopifyThemeSummary[]>;
  return payload.data;
}

export async function bootstrapThemeEditorShowcase(themeId?: string) {
  const shop = resolveShopParam();
  if (!shop) {
    throw new Error("Missing shop query parameter");
  }

  const response = await fetch("/api/shopify/showcase/bootstrap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      shop,
      themeId,
      target: "theme_extension",
      surface: "grid",
    }),
  });

  if (!response.ok) {
    throw new Error(`Showcase bootstrap failed with ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<ShopifyOnboardingBootstrapDto>;
  return payload.data;
}
