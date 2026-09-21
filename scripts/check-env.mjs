// Prints which database/auth env vars the build can see — names and set/blank/missing
// only, never values, so the output is safe to paste anywhere.
const names = [
  "DATABASE_URL",
  "DIRECT_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL_NON_POOLING",
  "AUTH_SECRET",
];
const state = (v) => (v === undefined ? "missing" : v.trim() === "" ? "BLANK" : "set");
for (const n of names) console.log(`env ${n}: ${state(process.env[n])}`);
const dbLike = Object.keys(process.env).filter((k) => /DATABASE|POSTGRES|NEON|PG/.test(k) && !names.includes(k));
if (dbLike.length) console.log(`other db-looking vars: ${dbLike.sort().join(", ")}`);
