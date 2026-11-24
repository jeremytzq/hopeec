import type { ApiRequest, ApiResponse } from "./_lib/types";
import { redis, redisConfigError } from "./_lib/kv";

const KEY = "hopeec:roster";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!redis) {
    res.status(500).json({ error: redisConfigError ?? "Cloud store is not configured." });
    return;
  }

  try {
    if (req.method === "GET") {
      const roster = (await redis.get(KEY)) ?? [];
      res.status(200).json({ roster });
      return;
    }

    if (req.method === "PUT") {
      const roster = (req.body as { roster?: unknown } | null)?.roster;
      if (!Array.isArray(roster)) {
        res.status(400).json({ error: "Expected { roster: RosterPerson[] }." });
        return;
      }
      await redis.set(KEY, roster);
      res.status(200).json({ ok: true });
      return;
    }

    res.setHeader("Allow", "GET, PUT");
    res.status(405).json({ error: `Method ${req.method} not allowed.` });
  } catch (err) {
    // Never let a Redis-layer error (bad token, network blip, etc.) crash the
    // function uncaught - always return a readable JSON error instead.
    res.status(502).json({ error: err instanceof Error ? err.message : "Cloud store request failed." });
  }
}
