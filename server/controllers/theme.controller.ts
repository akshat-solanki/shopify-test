import type { Request, Response } from "express";
import { z } from "zod";
import { getShopThemes } from "../services/shopify-theme.service";
import { bootstrapShowcaseForThemeEditor } from "../services/showcase-bootstrap.service";

const shopQuerySchema = z.object({
  shop: z.string().optional(),
});

const bootstrapSchema = z.object({
  shop: z.string().min(1, "shop is required"),
  themeId: z.string().optional(),
  target: z.enum(["app_embed", "theme_extension", "editor_preview"]).optional(),
  surface: z
    .enum(["grid", "carousel", "spotlight", "search_results", "collection_page", "recommendation", "quick_view"])
    .optional(),
});

export async function listThemesController(request: Request, response: Response) {
  const { shop } = shopQuerySchema.parse(request.query);
  const themes = await getShopThemes(shop);

  response.json({
    data: themes,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}

export async function bootstrapShowcaseController(request: Request, response: Response) {
  const input = bootstrapSchema.parse(request.body);
  const result = await bootstrapShowcaseForThemeEditor(input);

  response.status(201).json({
    data: result,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
}
