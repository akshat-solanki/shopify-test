import mongoose from "mongoose";
import { env } from "../config/env";

let connectionPromise: Promise<typeof mongoose> | null = null;

export function connectDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.MONGODB_URI, {
        dbName: "vypari-shopify-app",
        serverSelectionTimeoutMS: 10000,
      })
      .then((connection) => {
        console.log("[mongo] Connected to vypari-shopify-app");
        return connection;
      });
  }
  return connectionPromise;
}
