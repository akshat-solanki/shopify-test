import type { IncomingMessage, ServerResponse } from "node:http";
import { createServerApp } from "../server/app";
import { connectDatabase } from "../server/database/mongoose";

const app = createServerApp();
const databaseReady = connectDatabase();

type ForwardOptions = {
  stripPrefix: string;
  mountPrefix: string;
};

export async function forwardToExpress(
  request: IncomingMessage & { url?: string },
  response: ServerResponse,
  options: ForwardOptions,
) {
  await databaseReady;

  const requestUrl = new URL(request.url ?? "/", "http://localhost");
  const pathname = requestUrl.pathname;
  const strippedPath = pathname.startsWith(options.stripPrefix)
    ? pathname.slice(options.stripPrefix.length)
    : pathname;
  const normalizedPath = strippedPath || "/";

  request.url = `${options.mountPrefix}${normalizedPath}${requestUrl.search}`;

  return app(request as Parameters<typeof app>[0], response as Parameters<typeof app>[1]);
}
