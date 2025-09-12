// Optional KV support (Upstash). Avoid static imports so build works without the package.
let client: any | null = null;
export function kvEnabled() {
  return !!process.env.REDIS_URL && !!process.env.REDIS_TOKEN;
}
async function kv(): Promise<any> {
  if (client) return client;
  if (!kvEnabled()) throw new Error("KV not configured");
  // Lazy-load only when enabled so builds don’t require the module
  const mod: any = await import("@upstash/redis");
  client = new mod.Redis({ url: process.env.REDIS_URL!, token: process.env.REDIS_TOKEN! });
  return client;
}

export async function kvGet<T = any>(key: string): Promise<T | null> {
  if (!kvEnabled()) return null;
  try {
    const c = await kv();
    return await c.get<T>(key);
  } catch {
    return null;
  }
}

export async function kvSet<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  if (!kvEnabled()) return;
  try {
    const c = await kv();
    if (ttlSeconds) await c.set(key, value, { ex: ttlSeconds });
    else await c.set(key, value);
  } catch {
    // no-op
  }
}
