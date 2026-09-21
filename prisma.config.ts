import "dotenv/config";
import { defineConfig } from "prisma/config";
import { directUrl } from "./src/lib/direct-url";

// The CLI (migrate, db push, studio) talks to Neon over the direct, non-pooled
// connection. The app itself connects via the pooled DATABASE_URL in src/lib/db.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: directUrl,
  },
});
