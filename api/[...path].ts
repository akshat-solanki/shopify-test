import type { IncomingMessage, ServerResponse } from "node:http";
import { forwardToExpress } from "./_shared";

export default async function handler(request: IncomingMessage & { url?: string }, response: ServerResponse) {
  return forwardToExpress(request, response, {
    stripPrefix: "/api",
    mountPrefix: "/api",
  });
}
