// Non-pooled Neon connection for the Prisma CLI and seed script. The Vercel Neon
// integration only sets DATABASE_URL_UNPOOLED, so fall back to it. `||` (not `??`)
// so a variable that exists but is blank doesn't mask the next candidate.
export const directUrl =
  process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || undefined;
