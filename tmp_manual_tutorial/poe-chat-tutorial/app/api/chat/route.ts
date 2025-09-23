import { NextRequest } from "next/server";
import OpenAI from "openai";
import { poeModels, type PoeModelId, isAllowedModel } from "@/lib/models";

const POE_BASE_URL = process.env.POE_BASE_URL ?? "https://api.poe.com/v1";
const POE_API_KEY = process.env.POE_API_KEY ?? process.env.OPENAI_API_KEY ?? "";

if (!POE_API_KEY) {
  console.warn("⚠️ Missing POE_API_KEY or OPENAI_API_KEY. Set it before using the chat endpoint.");
}

const poeClient = new OpenAI({
  apiKey: POE_API_KEY,
  baseURL: POE_BASE_URL
});

const MODEL_FALLBACK: PoeModelId = "gpt-oss-20b";

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();
  try {
    const body = await request.json();
    const { messages, model } = body as {
      messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
      model?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Request must include at least one message." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const selectedModel: PoeModelId = isAllowedModel(model) ? model : MODEL_FALLBACK;

    const completion = await poeClient.chat.completions.create({
      model: selectedModel,
      messages,
      stream: true,
      max_tokens: 600,
      temperature: 0.7
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const usageTotals = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        try {
          for await (const chunk of completion) {
            const choice = chunk.choices?.[0];
            if (choice?.delta?.content) {
              const payload = JSON.stringify({
                type: "delta",
                content: choice.delta.content,
                model: selectedModel
              });
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            }
            if (chunk.usage) {
              usageTotals.prompt_tokens = chunk.usage.prompt_tokens ?? usageTotals.prompt_tokens;
              usageTotals.completion_tokens = chunk.usage.completion_tokens ?? usageTotals.completion_tokens;
              usageTotals.total_tokens = chunk.usage.total_tokens ?? usageTotals.total_tokens;
            }
          }
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "usage",
                usage: usageTotals,
                elapsedMs: Date.now() - requestStartedAt
              })}\n\n`
            )
          );
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: error instanceof Error ? error.message : "Unknown streaming error"
              })}\n\n`
            )
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    console.error("Poe chat error", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export function getModelMetadata() {
  return poeModels.map(({ id, label, description, recommended }) => ({
    id,
    label,
    description,
    recommended
  }));
}
