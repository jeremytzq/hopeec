import type { ApiRequest, ApiResponse } from "./_lib/types";
import { redis, redisConfigError } from "./_lib/kv";

// A Redis Hash (one field per plan id), not a single JSON-blob key, so that
// saving two DIFFERENT weeks from two different devices around the same time
// can never clobber each other - HSET/HDEL touch only their own field, with
// no read-modify-write round trip (and therefore no race) at all.
const HASH_KEY = "hopeec:plans";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!redis) {
    res.status(500).json({ error: redisConfigError ?? "Cloud store is not configured." });
    return;
  }

  try {
    if (req.method === "GET") {
      const plans = (await redis.hgetall<Record<string, unknown>>(HASH_KEY)) ?? {};
      res.status(200).json({ plans });
      return;
    }

    if (req.method === "POST") {
      const plan = (req.body as { plan?: { id?: unknown } } | null)?.plan;
      if (!plan || typeof plan.id !== "string" || !plan.id) {
        res.status(400).json({ error: "Expected { plan: WeeklyPlan } with a non-empty id." });
        return;
      }
      await redis.hset(HASH_KEY, { [plan.id]: plan });
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "DELETE") {
      const id = typeof req.query.id === "string" ? req.query.id : undefined;
      if (!id) {
        res.status(400).json({ error: "Expected ?id=<planId>." });
        return;
      }
      await redis.hdel(HASH_KEY, id);
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    res.status(405).json({ error: `Method ${req.method} not allowed.` });
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Cloud store request failed." });
  }
}
