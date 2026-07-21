import { createServerApp } from "./app";
import { env } from "./config/env";
import { connectDatabase } from "./database/mongoose";

async function start() {
  await connectDatabase();
  const app = createServerApp();
  app.listen(env.PORT, () => {
    console.log(`Vypari Shopify backend listening on http://localhost:${env.PORT}`);
  });
}

start().catch((error) => {
  console.error("Failed to start backend", error);
  process.exit(1);
});
