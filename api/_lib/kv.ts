import { Redis } from "@upstash/redis";

// Vercel's "Vercel KV" product was repositioned as a Marketplace integration
// (commonly Upstash for Redis), so the env vars can land under either the
// legacy KV_REST_API_* names or Upstash's own UPSTASH_REDIS_REST_* names
// depending on how the store was connected. Accept both.
const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = url && token ? new Redis({ url, token }) : null;
