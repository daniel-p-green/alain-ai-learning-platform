import { APIError } from "encore.dev/api";
import { verifyToken } from "@clerk/backend";

export async function requireUserId(ctx: any): Promise<string> {
  const authz: string | undefined =
    ctx?.req?.header?.("Authorization") || ctx?.req?.header?.("authorization");
  if (!authz || typeof authz !== "string") {
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

