export const backendBase = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";

export function backendUrl(path: string): string {
  const base = backendBase.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

