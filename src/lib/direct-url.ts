// Non-pooled Neon connection for the Prisma CLI and seed script. The Vercel Neon
// integration only sets DATABASE_URL_UNPOOLED, so fall back to it. `||` (not `??`)
// so a variable that exists but is blank doesn't mask the next candidate.
const raw =
  process.env.DIRECT_URL || process.env.DATABASE_URL_UNPOOLED || process.env.POSTGRES_URL_NON_POOLING || undefined;

// Neon suspends idle computes; waking one can exceed Prisma's 5s default connect
// timeout and fail the build with P1001.
function withConnectTimeout(url: string) {
  const u = new URL(url);
  if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "30");
  return u.toString();
}

export const directUrl = raw ? withConnectTimeout(raw) : undefined;
