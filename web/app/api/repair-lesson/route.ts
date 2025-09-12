import { safeAuth, demoBypassEnabled } from "../../../lib/auth";
import { backendUrl } from "../../../lib/backend";

export async function POST(req: Request) {
  const { userId, getToken } = await safeAuth();
  if (!userId && !demoBypassEnabled()) return new Response("Unauthorized", { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.hfUrl) return new Response("hfUrl required", { status: 400 });

  // Use shared backend URL helper for consistency

  // 1) Call backend repair
  const repairResp = await fetch(backendUrl('/lessons/repair'), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hfUrl: body.hfUrl,
      difficulty: body.difficulty || "beginner",
      teacherModel: body.teacherModel || "GPT-OSS-20B",
      fixes: body.fixes || ["add_description", "add_intro_step"]
    })
  });
  let repair: any = null;
  try {
    repair = await repairResp.json();
  } catch (e) {
    // Backend returned non-JSON; treat as bad gateway
    return new Response(`Repair failed: invalid response from backend`, { status: 502 });
  }
  if (!repairResp.ok) {
    // Propagate backend HTTP status on non-2xx
    return Response.json({ success: false, error: { code: 'backend_error', message: repair?.error?.message || 'Repair failed' } }, { status: repairResp.status });
  }
  if (!repair?.success) {
    // Map logical failure to 422 Unprocessable
    return Response.json(repair, { status: 422 });
  }

  // 2) Import repaired lesson
  const token = await getToken();
  const impResp = await fetch(backendUrl('/tutorials/import'), {
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
