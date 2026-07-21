import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/http-error";

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: "ValidationError",
      message: "Request validation failed",
      details: error.flatten(),
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      error: "HttpError",
      message: error.message,
      details: error.details,
    });
  }

  const message = error instanceof Error ? error.message : "Unexpected server error";
  return response.status(500).json({
    error: "InternalServerError",
    message,
  });
}
