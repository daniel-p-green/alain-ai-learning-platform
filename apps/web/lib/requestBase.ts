import { headers } from 'next/headers';

/**
 * Returns the absolute base URL for this Next.js app, preferring explicit env config
 * but falling back to the incoming request headers when running server components.
 */
export function appBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');
  if (envBase) return envBase;

  const h = headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  const proto = h.get('x-forwarded-proto');
  if (host) {
    const inferredProto = proto || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https');
    return `${inferredProto}://${host}`;
  }

  // Fallback for non-HTTP contexts (tests, scripts)
  return 'http://localhost:3000';
}
