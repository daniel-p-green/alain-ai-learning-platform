import { Redis } from "@upstash/redis";

let client: Redis | null = null;
export function kvEnabled() {
  return !!process.env.REDIS_URL && !!process.env.REDIS_TOKEN;
}
function kv(): Redis {
  if (!client) {
    if (!kvEnabled()) throw new Error("KV not configured");
    client = new Redis({ url: process.env.REDIS_URL!, token: process.env.REDIS_TOKEN! });
  }
  return client;
}

export async function kvGet<T = any>(key: string): Promise<T | null> {
  if (!kvEnabled()) return null;
  try {
    return await kv().get<T>(key);
  } catch {
    return null;
  }
}

export async function kvSet<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (!kvEnabled()) return;
  try {
    if (ttlSeconds) await kv().set(key, value, { ex: ttlSeconds });
    else await kv().set(key, value);
  } catch {
    // no-op
  }
}

