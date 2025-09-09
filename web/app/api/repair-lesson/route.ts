import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId, getToken } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.hfUrl) return new Response("hfUrl required", { status: 400 });

  const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";

  // 1) Call backend repair
  const repairResp = await fetch(`${base}/lessons/repair`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hfUrl: body.hfUrl,
      difficulty: body.difficulty || "beginner",
      teacherModel: body.teacherModel || "GPT-OSS-20B",
      fixes: body.fixes || ["add_description", "add_intro_step"]
    })
  });
  const repair = await repairResp.json();
  if (!repair.success) return Response.json(repair, { status: 200 });

  // 2) Import repaired lesson
  const token = await getToken();
  const impResp = await fetch(`${base}/tutorials/import`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(repair.lesson)
  });
  if (!impResp.ok) {
    const t = await impResp.text();
    return new Response(`Import failed: ${t}`, { status: 500 });
  }
  const imp = await impResp.json();
  return Response.json({ success: true, tutorialId: imp.tutorialId, preview: {
    title: repair.lesson.title,
    description: repair.lesson.description,
    learning_objectives: repair.lesson.learning_objectives || [],
    first_step: repair.lesson.steps?.[0] || null,
  }});
}

