import { currentUser } from "@clerk/nextjs/server";

export async function requireAdmin(): Promise<{ ok: boolean; reason?: string }> {
  try {
    const user = await currentUser();
    const role = (user?.publicMetadata as any)?.role;
    if (role === "admin") return { ok: true };
    return { ok: false, reason: "forbidden" };
  } catch {
    return { ok: false, reason: "unauthorized" };
  }
}

