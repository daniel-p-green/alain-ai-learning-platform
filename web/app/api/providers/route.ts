import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });
  return Response.json({
    providers: [
      { name: "poe", stream: true },
      { name: "openai-compatible", stream: true },
    ],
  });
}

