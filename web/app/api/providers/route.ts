import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    // Proxy to backend capabilities endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
    const response = await fetch(`${backendUrl}/providers`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Failed to fetch provider capabilities:", error);
    // Fallback to basic providers if backend is unavailable
    return Response.json({
      providers: [
        {
          id: "poe",
          name: "Poe",
          description: "Single API key for multiple AI models",
          supportsStreaming: true,
          requiresAuth: true,
          status: "unknown",
          models: []
        },
        {
          id: "openai-compatible",
          name: "OpenAI Compatible",
          description: "Bring your own OpenAI-compatible endpoint",
          supportsStreaming: true,
          requiresAuth: true,
          status: "unknown",
          models: []
        }
      ],
      teacherModels: {
        available: false,
        provider: "poe",
        models: []
      },
      defaultProvider: "poe"
    });
  }
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";

    const response = await fetch(`${backendUrl}/providers/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Failed to validate provider:", error);
    return Response.json(
      { valid: false, message: "Unable to validate provider configuration" },
      { status: 500 }
    );
  }
}

