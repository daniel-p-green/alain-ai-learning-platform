import { NextResponse } from "next/server";
import { getNotebook } from "@/lib/notebookStore";

export const runtime = "edge";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const rec = getNotebook(params.id);
  if (!rec) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(rec);
}

