import { api } from "encore.dev/api";

// Disabled for MVP to reduce risk. Use Next.js API routes under web/app/api/lmstudio/*.

export const lmstudioSearch = api<{}, { message: string }>(
  { expose: true, method: "GET", path: "/lmstudio/search" },
  async () => ({ message: "LM Studio search disabled in backend; use web/app/api/lmstudio/search" })
);

export const lmstudioOptions = api<{ id: string }, { message: string }>(
  { expose: true, method: "GET", path: "/lmstudio/options/:id" },
  // Note: _id is intentionally unused. Declared to satisfy Encore's path param schema; route remains disabled.
  async ({ id: _id }) => ({ message: "LM Studio options disabled in backend; use web/app/api/lmstudio/options/[id]" })
);

export const lmstudioDownload = api<{}, { message: string }>(
  { expose: true, method: "POST", path: "/lmstudio/download" },
  async () => ({ message: "LM Studio download disabled in backend; use web/app/api/lmstudio/download" })
);
