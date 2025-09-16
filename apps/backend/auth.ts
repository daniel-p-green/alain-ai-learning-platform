import { APIError } from "encore.dev/api";
import { currentRequest } from "encore.dev";
import { verifyToken } from "@clerk/backend";

function getAuthorizationHeader(): string | undefined {
  const req = currentRequest();
  if (!req || req.type !== "api-call") return undefined;
  const headers = req.headers || {};
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === "authorization") {
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        const [first] = value;
        return typeof first === "string" ? first : undefined;
      }
      return undefined;
    }
  }
  return undefined;
}

export async function requireUserId(): Promise<string> {
  const authz = getAuthorizationHeader();
  if (!authz || typeof authz !== "string") {
    // Local demo bypass: allow unauthenticated access if explicitly enabled
    const bypass = (process.env.DEMO_ALLOW_UNAUTH || '').toLowerCase();
    const enabled = bypass === '1' || bypass === 'true' || bypass === 'yes' || bypass === 'on';
    if (enabled) return 'demo-user';
    throw APIError.unauthenticated("Missing Authorization header");
  }
  const m = authz.match(/^Bearer\s+(.+)/i);
  if (!m) throw APIError.unauthenticated("Invalid Authorization header");
  const token = m[1];

  const issuer = process.env.CLERK_JWT_ISSUER;
  try {
    const payload: any = await verifyToken(token, issuer ? { issuer } : {} as any);
    const sub = payload?.sub || payload?.claims?.sub;
    if (!sub) throw new Error("No sub in token");
    return String(sub);
  } catch (err) {
    throw APIError.unauthenticated("Invalid or expired token");
  }
}
