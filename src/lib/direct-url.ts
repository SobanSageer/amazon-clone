// Non-pooled Neon connection for the Prisma CLI and seed script. The Vercel Neon
// integration only sets DATABASE_URL_UNPOOLED, so fall back to it.
export const directUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL_UNPOOLED ?? process.env.POSTGRES_URL_NON_POOLING;
