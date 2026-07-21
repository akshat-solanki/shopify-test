import { createServerApp } from "./server/app";
import { connectDatabase } from "./server/database/mongoose";

await connectDatabase();

const app = createServerApp();

export default app;
