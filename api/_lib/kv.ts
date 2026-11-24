import { Redis } from "@upstash/redis";

// Vercel's "Vercel KV" product was repositioned as a Marketplace integration
// (commonly Upstash for Redis), so the env vars can land under either the
// legacy KV_REST_API_* names or Upstash's own UPSTASH_REDIS_REST_* names
// depending on how the store was connected. Accept both.
function clean(value: string | undefined): string | undefined {
  if (!value) return undefined;
  // Strip accidental copy-paste artifacts (surrounding quotes, whitespace) -
  // a malformed URL throws synchronously inside `new Redis(...)` below, which
  // would otherwise crash this module at import time and take the whole
  // serverless function down with FUNCTION_INVOCATION_FAILED on every request.
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");
  return trimmed || undefined;
}

const url = clean(process.env.KV_REST_API_URL) ?? clean(process.env.UPSTASH_REDIS_REST_URL);
const token = clean(process.env.KV_REST_API_TOKEN) ?? clean(process.env.UPSTASH_REDIS_REST_TOKEN);

let redisInstance: Redis | null = null;
let configError: string | null = null;

if (!url || !token) {
  configError = "Missing KV_REST_API_URL/TOKEN or UPSTASH_REDIS_REST_URL/TOKEN environment variables.";
} else {
  try {
    redisInstance = new Redis({ url, token });
  } catch (err) {
    configError = `Failed to create the Redis client: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export const redis = redisInstance;
export const redisConfigError = configError;
