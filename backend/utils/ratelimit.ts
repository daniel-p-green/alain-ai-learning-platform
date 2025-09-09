type Bucket = { times: number[] };
const store = new Map<string, Bucket>();

export function allowRate(userId: string, key: string, max: number, windowMs: number): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const k = `${userId}::${key}`;
  let b = store.get(k);
  if (!b) { b = { times: [] }; store.set(k, b); }
  const arr = b.times;
  while (arr.length && now - arr[0] > windowMs) arr.shift();
  if (arr.length >= max) {
    const retryAfter = Math.ceil((windowMs - (now - arr[0])) / 1000);
    return { ok: false, retryAfter };
  }
  arr.push(now);
  if (arr.length === 0) store.delete(k);
  return { ok: true };
}

