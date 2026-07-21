import fs from "node:fs";
import path from "node:path";
import { env } from "./env";

const SHOPIFY_APP_TOML_PATH = path.resolve(process.cwd(), "shopify.app.toml");
const APPLICATION_URL_PATTERN = /^\s*application_url\s*=\s*"([^"]+)"\s*$/m;

export function getAppUrl() {
  try {
    const toml = fs.readFileSync(SHOPIFY_APP_TOML_PATH, "utf8");
    const match = toml.match(APPLICATION_URL_PATTERN);
    if (match?.[1]) {
      return match[1];
    }
  } catch {
    // Fall back to the environment value when the local TOML file is unavailable.
  }

  return env.APP_URL;
}
