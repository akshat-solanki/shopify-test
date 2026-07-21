import dotenv from "dotenv";
import { z } from "zod";
import { DEFAULT_PRODUCT_LIMIT, SHOPIFY_API_VERSION } from "../../shared/constants/shopify";

dotenv.config({ path: ".env.local" });
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  APP_URL: z.string().url("APP_URL must be a valid URL"),
  SHOPIFY_API_KEY: z.string().min(1, "SHOPIFY_API_KEY is required"),
  SHOPIFY_API_SECRET: z.string().min(1, "SHOPIFY_API_SECRET is required"),
  SHOPIFY_SCOPES: z.string().default("read_products,read_themes,write_app_proxy"),
  SHOPIFY_SHOP_DOMAIN: z.string().optional(),
  SHOPIFY_ADMIN_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_STOREFRONT_ACCESS_TOKEN: z.string().optional(),
  SHOPIFY_API_VERSION: z.string().default(SHOPIFY_API_VERSION),
  SHOPIFY_PRODUCT_LIMIT: z.coerce.number().int().min(1).max(24).default(DEFAULT_PRODUCT_LIMIT),
  SHOPIFY_PRODUCT_QUERY: z.string().default("status:active"),
});

export const env = envSchema.parse(process.env);
