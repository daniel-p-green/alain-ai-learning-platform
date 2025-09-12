import { NextResponse } from "next/server";
import { cloneNotebook } from "@/lib/notebookStore";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const newId = crypto.randomUUID();
  const cloned = cloneNotebook(params.id, newId);
  if (!cloned) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ ok: true, id: newId, meta: cloned.meta });
}

