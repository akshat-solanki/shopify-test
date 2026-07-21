import type { Request, Response } from "express";

export function healthController(_request: Request, response: Response) {
  response.json({
    status: "ok",
    service: "vypari-shopify-backend",
    timestamp: new Date().toISOString(),
  });
}
