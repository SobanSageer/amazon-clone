import "dotenv/config";
import { defineConfig } from "prisma/config";

// The CLI (migrate, db push, studio) talks to Neon over the direct, non-pooled
// connection. The app itself connects via the pooled DATABASE_URL in src/lib/db.ts.
// Read without env() so `prisma generate` in the Vercel build doesn't need it set.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});
