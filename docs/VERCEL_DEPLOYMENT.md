# Vercel Deployment

This repo deploys to Vercel as:

- a root `server.ts` Express runtime for `/auth`, `/api`, and `/proxy`
- a static Vite frontend copied into `public/` at build time

## Required Vercel environment variables

- `APP_URL`
- `CORS_ORIGIN`
- `MONGODB_URI`
- `SHOPIFY_API_KEY`
- `VITE_SHOPIFY_API_KEY`
- `SHOPIFY_API_SECRET`
- `SHOPIFY_SCOPES`
- `SHOPIFY_API_VERSION`
- `SHOPIFY_ADMIN_ACCESS_TOKEN` if still needed for non-install flows
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` if storefront API calls are used

Recommended production values:

- `APP_URL=https://<your-vercel-domain>`
- `CORS_ORIGIN=https://<your-vercel-domain>`
- `SHOPIFY_SCOPES=read_products,read_themes,write_app_proxy`

## Shopify app config

Before production deploy, update [shopify.app.toml](../shopify.app.toml):

- `application_url = "https://<your-vercel-domain>"`
- add `https://<your-vercel-domain>/auth/callback` to `[auth].redirect_urls`

Then run Shopify CLI deploy so Shopify picks up the new app URL, redirect URL, and app proxy target.
