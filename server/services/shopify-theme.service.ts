import type { ShopifyThemeSummary } from "../../shared/contracts";
import { adminThemesQuery } from "../shopify/admin/queries";
import { shopifyAdminGraphQL } from "../shopify/admin/admin-client";
import { resolveShopAccess } from "../shopify/oauth/oauth.service";

type AdminThemesResponse = {
  themes: {
    nodes: Array<{
      id: string;
      name: string;
      role: ShopifyThemeSummary["role"];
      processing: boolean;
    }>;
  };
};

function extractThemeId(gid: string) {
  const match = gid.match(/\/Theme\/(\d+)$/);
  return match?.[1] ?? gid;
}

function buildThemeEditorUrl(shop: string, themeId: string) {
  return `https://${shop}/admin/themes/${themeId}/editor`;
}

function buildThemePreviewUrl(shop: string, role: ShopifyThemeSummary["role"], themeId: string) {
  return role === "MAIN" ? `https://${shop}` : `https://${shop}/?preview_theme_id=${themeId}`;
}

export async function getShopThemes(shop?: string): Promise<ShopifyThemeSummary[]> {
  const { shop: resolvedShop } = await resolveShopAccess(shop);
  const data = await shopifyAdminGraphQL<AdminThemesResponse>(adminThemesQuery, {}, { shop });

  return data.themes.nodes.map((theme) => {
    const themeId = extractThemeId(theme.id);

    return {
      id: theme.id,
      themeId,
      name: theme.name,
      role: theme.role,
      processing: Boolean(theme.processing),
      editorUrl: buildThemeEditorUrl(resolvedShop, themeId),
      previewUrl: buildThemePreviewUrl(resolvedShop, theme.role, themeId),
      supportsAppBlocks: theme.role === "MAIN" || theme.role === "DEVELOPMENT" ? "likely_supported" : "requires_check",
    };
  });
}
