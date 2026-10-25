import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Drizzle Kit runs outside of Next.js, so load the same local env files.
config({ path: ".env.local" });
config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
