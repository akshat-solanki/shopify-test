import { z } from "zod";

export const productCatalogQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(24).optional(),
  query: z.string().trim().max(120).optional(),
  shop: z.string().trim().min(1).optional(),
});

export type ProductCatalogQueryInput = z.infer<typeof productCatalogQuerySchema>;
