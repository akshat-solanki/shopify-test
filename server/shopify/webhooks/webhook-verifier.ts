import crypto from "node:crypto";

export function verifyShopifyWebhook(rawBody: string, hmacHeader: string | undefined, secret: string) {
  if (!hmacHeader) return false;
  const digest = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmacHeader));
}
