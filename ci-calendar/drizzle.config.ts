import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();
export default {
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  driver: "turso",
  dbCredentials: {
    url: process.env.NEXT_DEV_DATABASE_URL || "",
    authToken: process.env.NEXT_DEV_DATABASE_AUTH_TOKEN,
  },
} satisfies Config;
