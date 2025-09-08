import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const stream = body.stream !== false; // default to streaming
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";

  try {
    // Get Clerk JWT token to forward to backend
    const token = await getToken();

    if (stream) {
      // Proxy streaming request to Encore SSE endpoint
      const encoreResponse = await fetch(`${backendUrl}/execute/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!encoreResponse.ok) {
        const errorText = await encoreResponse.text();
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "backend_error",
              message: `Backend error: ${encoreResponse.status} ${errorText}`
            }
          }),
          { status: encoreResponse.status }
        );
      }

      // Return the SSE stream directly
      return new Response(encoreResponse.body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Proxy non-streaming request to Encore execute endpoint
      const encoreResponse = await fetch(`${backendUrl}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await encoreResponse.json();
      return Response.json(data, { status: encoreResponse.status });
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json(
      {
        success: false,
        error: {
          code: "proxy_error",
          message: "Failed to connect to backend service"
        }
      },
      { status: 500 }
    );
  }
}
