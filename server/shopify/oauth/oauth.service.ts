import crypto from "node:crypto";
import { env } from "../../config/env";
import {
  InstallationModel,
  MerchantModel,
  StoreModel,
} from "../../repositories/models";
import { HttpError } from "../../utils/http-error";

type OAuthStateRecord = {
  shop: string;
  createdAt: number;
};

type ShopifyAccessTokenResponse = {
  access_token: string;
  scope: string;
};

type ShopifyShopProfileResponse = {
  data?: {
    shop?: {
      name?: string | null;
      email?: string | null;
      myshopifyDomain?: string | null;
      currencyCode?: string | null;
      ianaTimezone?: string | null;
      primaryDomain?: {
        host?: string | null;
        url?: string | null;
      } | null;
      plan?: {
        displayName?: string | null;
        partnerDevelopment?: boolean | null;
        shopifyPlus?: boolean | null;
      } | null;
    } | null;
  };
  errors?: Array<{ message?: string }>;
};

const STATE_TTL_MS = 10 * 60 * 1000;
const pendingStates = new Map<string, OAuthStateRecord>();

function pruneExpiredStates() {
  const now = Date.now();
  for (const [state, record] of pendingStates.entries()) {
    if (now - record.createdAt > STATE_TTL_MS) {
      pendingStates.delete(state);
    }
  }
}

function normalizeShop(shop: string) {
  const normalized = shop.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
    throw new HttpError(400, "Invalid Shopify shop domain", { shop });
  }
  return normalized;
}

function buildMessageFromParams(params: URLSearchParams) {
  return [...params.entries()]
    .filter(([key]) => key !== "hmac" && key !== "signature")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

export function verifyShopifyHmac(url: URL) {
  const providedHmac = url.searchParams.get("hmac");
  if (!providedHmac) {
    throw new HttpError(400, "Missing Shopify HMAC signature");
  }

  const message = buildMessageFromParams(url.searchParams);
  const digest = crypto.createHmac("sha256", env.SHOPIFY_API_SECRET).update(message).digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(providedHmac))) {
    throw new HttpError(401, "Invalid Shopify HMAC signature");
  }
}

function buildAuthorizeUrl(shop: string, state: string, appUrl: string) {
  const params = new URLSearchParams({
    client_id: env.SHOPIFY_API_KEY,
    scope: env.SHOPIFY_SCOPES,
    redirect_uri: `${appUrl}/auth/callback`,
    state,
  });

  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

async function exchangeCodeForAccessToken(shop: string, code: string) {
  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: env.SHOPIFY_API_KEY,
      client_secret: env.SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, "Failed to exchange Shopify authorization code", {
      status: response.status,
      statusText: response.statusText,
    });
  }

  return (await response.json()) as ShopifyAccessTokenResponse;
}

async function fetchShopProfile(shop: string, accessToken: string) {
  const response = await fetch(`https://${shop}/admin/api/${env.SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: `
        query AppInstallationShopProfile {
          shop {
            name
            email
            myshopifyDomain
            currencyCode
            ianaTimezone
            primaryDomain {
              host
              url
            }
            plan {
              displayName
              partnerDevelopment
              shopifyPlus
            }
          }
        }
      `,
    }),
  });

  if (!response.ok) {
    throw new HttpError(502, "Failed to fetch Shopify shop profile", {
      status: response.status,
      statusText: response.statusText,
    });
  }

  const payload = (await response.json()) as ShopifyShopProfileResponse;
  if (payload.errors?.length || !payload.data?.shop) {
    throw new HttpError(502, "Shopify returned an invalid shop profile response", {
      errors: payload.errors,
    });
  }

  return payload.data.shop;
}

export function beginShopifyInstall(rawShop: string, appUrl: string) {
  pruneExpiredStates();

  const shop = normalizeShop(rawShop);
  const state = crypto.randomBytes(16).toString("hex");

  pendingStates.set(state, {
    shop,
    createdAt: Date.now(),
  });

  return buildAuthorizeUrl(shop, state, appUrl);
}

export async function completeShopifyInstall(input: { shop: string; code: string; state: string }) {
  pruneExpiredStates();

  const shop = normalizeShop(input.shop);
  const pendingState = pendingStates.get(input.state);
  if (!pendingState || pendingState.shop !== shop) {
    throw new HttpError(401, "Invalid or expired Shopify OAuth state");
  }
  pendingStates.delete(input.state);

  const tokenPayload = await exchangeCodeForAccessToken(shop, input.code);
  const shopProfile = await fetchShopProfile(shop, tokenPayload.access_token);
  const now = new Date();

  let existingStore = await StoreModel.findOne({ shop });
  let merchantId = existingStore?.merchantId;

  if (!merchantId) {
    const merchant = await MerchantModel.create({
      ownerEmail: shopProfile.email ?? `owner@${shop}`,
      defaultStoreId: "pending",
      timezone: shopProfile.ianaTimezone ?? "UTC",
      locale: "en",
    });
    merchantId = merchant.id;
  }

  const store = await StoreModel.findOneAndUpdate(
    { shop },
    {
      merchantId,
      shop,
      displayName: shopProfile.name ?? shop,
      primaryDomain: shopProfile.primaryDomain?.host ?? shopProfile.primaryDomain?.url ?? shop,
      currencyCode: shopProfile.currencyCode ?? "USD",
      locale: "en",
      timeZone: shopProfile.ianaTimezone ?? "UTC",
      shopify: {
        ...shopProfile,
        installedScopes: tokenPayload.scope.split(",").filter(Boolean),
        updatedAt: now.toISOString(),
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  if (!store) {
    throw new HttpError(500, "Failed to persist Shopify store installation");
  }

  await MerchantModel.updateOne(
    { _id: merchantId, defaultStoreId: "pending" },
    {
      $set: {
        defaultStoreId: store.id,
      },
    },
  );

  await InstallationModel.findOneAndUpdate(
    {
      merchantId,
      storeId: store.id,
    },
    {
      merchantId,
      storeId: store.id,
      status: "active",
      scopes: tokenPayload.scope.split(",").filter(Boolean),
      installedAt: now,
      uninstalledAt: null,
      accessTokenRef: tokenPayload.access_token,
      apiVersion: env.SHOPIFY_API_VERSION,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  );

  return {
    shop,
    host: Buffer.from(`${shop}/admin`, "utf8").toString("base64"),
  };
}

export async function resolveShopAccess(shop?: string) {
  if (shop) {
    const normalizedShop = normalizeShop(shop);
    const store = await StoreModel.findOne({ shop: normalizedShop });
    if (!store) {
      throw new HttpError(404, "No Shopify store installation found for this shop", {
        shop: normalizedShop,
      });
    }

    const installation = await InstallationModel.findOne({
      storeId: store.id,
      status: "active",
    }).sort({ updatedAt: -1 });

    if (!installation?.accessTokenRef) {
      throw new HttpError(404, "No active Shopify installation token found for this shop", {
        shop: normalizedShop,
      });
    }

    return {
      shop: normalizedShop,
      accessToken: installation.accessTokenRef,
    };
  }

  if (env.SHOPIFY_SHOP_DOMAIN && env.SHOPIFY_ADMIN_ACCESS_TOKEN) {
    return {
      shop: normalizeShop(env.SHOPIFY_SHOP_DOMAIN),
      accessToken: env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    };
  }

  throw new HttpError(400, "Missing shop context for Shopify Admin API request");
}
