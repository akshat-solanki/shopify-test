import type { Request, Response } from "express";
import { z } from "zod";
import { getAppUrl } from "../config/app-url";
import { beginShopifyInstall, completeShopifyInstall, verifyShopifyHmac } from "../shopify/oauth/oauth.service";

const authRequestSchema = z.object({
  shop: z.string().min(1, "shop is required"),
});

const authCallbackSchema = z.object({
  shop: z.string().min(1, "shop is required"),
  code: z.string().min(1, "code is required"),
  state: z.string().min(1, "state is required"),
  host: z.string().optional(),
});

function requestUrl(request: Request) {
  return new URL(`${getAppUrl()}${request.originalUrl}`);
}

export function beginAuthController(request: Request, response: Response) {
  const { shop } = authRequestSchema.parse(request.query);
  const url = requestUrl(request);

  if (url.searchParams.has("hmac")) {
    verifyShopifyHmac(url);
  }

  const redirectUrl = beginShopifyInstall(shop, getAppUrl());
  response.redirect(302, redirectUrl);
}

export async function authCallbackController(request: Request, response: Response) {
  const { shop, code, state, host } = authCallbackSchema.parse(request.query);
  const url = requestUrl(request);
  verifyShopifyHmac(url);

  const result = await completeShopifyInstall({ shop, code, state });
  const appUrl = new URL(getAppUrl());

  appUrl.searchParams.set("shop", result.shop);
  appUrl.searchParams.set("host", host ?? result.host);
  appUrl.searchParams.set("installation", "success");

  response.redirect(302, appUrl.toString());
}
