import crypto from 'crypto';

export function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export async function fetchText(url, headers = {}) {
  const res = await fetch(url, { headers });
  const text = await res.text();
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers), text };
}

export async function fetchBuffer(url, headers = {}) {
  const res = await fetch(url, { headers });
  const arrayBuffer = await res.arrayBuffer();
  const buf = Buffer.from(arrayBuffer);
  return { status: res.status, ok: res.ok, headers: Object.fromEntries(res.headers), buffer: buf };
}
