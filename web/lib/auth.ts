// Safe Clerk auth helpers for environments without middleware
export async function safeAuth(): Promise<{ userId: string | null; getToken: () => Promise<string | null> }> {
  try {
    const mod: any = await import("@clerk/nextjs/server");
    const a = await mod.auth();
    return {
      userId: a?.userId ?? null,
      getToken: a?.getToken ?? (async () => null),
    };
  } catch {
    return { userId: null, getToken: async () => null };
  }
}

export function demoBypassEnabled(): boolean {
  const v = (process.env.WEB_DEMO_ALLOW_UNAUTH || process.env.DEMO_ALLOW_UNAUTH || "").toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

