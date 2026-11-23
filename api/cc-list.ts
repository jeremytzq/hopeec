import type { ApiRequest, ApiResponse } from "./_lib/types";
import { redis } from "./_lib/kv";

const KEY = "hopeec:cclist";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!redis) {
    res.status(500).json({ error: "Cloud store is not configured (missing KV/Upstash env vars)." });
    return;
  }

  if (req.method === "GET") {
    const ccList = (await redis.get(KEY)) ?? [];
    res.status(200).json({ ccList });
    return;
  }

  if (req.method === "PUT") {
    const ccList = (req.body as { ccList?: unknown } | null)?.ccList;
    if (!Array.isArray(ccList)) {
      res.status(400).json({ error: "Expected { ccList: CcPerson[] }." });
      return;
    }
    await redis.set(KEY, ccList);
    res.status(200).json({ ok: true });
    return;
  }

  res.setHeader("Allow", "GET, PUT");
  res.status(405).json({ error: `Method ${req.method} not allowed.` });
}
