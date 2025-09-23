"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { PoeModelId } from "@/lib/models";
import type { ChatTelemetry } from "@/lib/telemetry";
import { createTelemetryId } from "@/lib/telemetry";

type ChatWindowProps = {
  model: PoeModelId;
  onTelemetry: (entry: ChatTelemetry) => void;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

function extractEvents(buffer: string): { events: Array<Record<string, unknown>>; rest: string } {
  const events: Array<Record<string, unknown>> = [];
  let remainder = buffer;
  let boundaryIndex = remainder.indexOf("\n\n");

  while (boundaryIndex !== -1) {
    const raw = remainder.slice(0, boundaryIndex).trim();
    remainder = remainder.slice(boundaryIndex + 2);
    if (raw.startsWith("data:")) {
      const payload = raw.replace(/^data:\s*/, "");
      if (payload) {
        try {
          events.push(JSON.parse(payload));
        } catch (error) {
          console.warn("Failed to parse SSE payload", error);
        }
      }
    }
    boundaryIndex = remainder.indexOf("\n\n");
  }

  return { events, rest: remainder };
}

export function ChatWindow({ model, onTelemetry }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const resetConversation = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setMessages([]);
    setError(null);
  }, []);

  const chatTranscript = useMemo(() => {
    return messages.map((message) => ({ role: message.role, content: message.content }));
  }, [messages]);

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return;
    if (isLoading) return;

    const prompt = input.trim();
    setInput("");
    setError(null);
    setIsLoading(true);

    const telemetryId = createTelemetryId();
    const startedAt = new Date();
    const highResStart = performance.now();
    let promptTokens = 0;
    let completionTokens = 0;
    let errorMessage: string | undefined;

    const userMessage: ChatMessage = {
      id: `${telemetryId}-user`,
      role: "user",
      content: prompt
    };

    const assistantMessageId = `${telemetryId}-assistant`;

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: "assistant",
        content: ""
      }
    ]);

    const abortController = new AbortController();
    controllerRef.current = abortController;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: [...chatTranscript, { role: "user", content: prompt }],
          model
        }),
        headers: {
          "Content-Type": "application/json"
        },
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error("Response body missing");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events, rest } = extractEvents(buffer);
        buffer = rest;

        for (const event of events) {
          const type = event.type;
          if (type === "delta" && typeof event.content === "string") {
            assistantContent += event.content;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: assistantContent }
                  : message
              )
            );
          }
          if (type === "usage" && typeof event.usage === "object" && event.usage !== null) {
            const usage = event.usage as Record<string, number>;
            promptTokens = usage.prompt_tokens ?? promptTokens;
            completionTokens = usage.completion_tokens ?? completionTokens;
          }
          if (type === "error" && typeof event.message === "string") {
            errorMessage = event.message;
            setError(event.message);
          }
        }
      }

      if (assistantContent.trim().length === 0) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: "(No response received from Poe.)" }
              : message
          )
        );
      }

      onTelemetry({
        id: telemetryId,
        model,
        startedAt: startedAt.toISOString(),
        latencyMs: Math.round(performance.now() - highResStart),
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        status: errorMessage ? "error" : "success",
        errorMessage
      });
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Unknown error";
      setError(message);
      onTelemetry({
        id: telemetryId,
        model,
        startedAt: startedAt.toISOString(),
        latencyMs: Math.round(performance.now() - highResStart),
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        status: "error",
        errorMessage: message
      });
    } finally {
      setIsLoading(false);
      controllerRef.current = null;
    }
  }, [chatTranscript, input, isLoading, model, onTelemetry]);

  return (
    <section className="card">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>Poe Chat Playground</strong>
          <p style={{ margin: "0.25rem 0", color: "#94a3b8" }}>
            Send a message, stream back the teacher response, and capture telemetry for every turn.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="button"
            onClick={resetConversation}
            disabled={isLoading || messages.length === 0}
            style={{
              padding: "0.5rem 0.85rem",
              borderRadius: "10px",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer"
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <div className="callout" style={{ marginTop: "1rem" }}>
        <strong>Tip:</strong> Try instructing the assistant to explain how to evaluate a model or provide debugging checklists—longer answers showcase streaming feedback.
      </div>

      <div className="chat-container" aria-live="polite">
        {messages.length === 0 ? (
          <p style={{ color: "#64748b" }}>No messages yet. Start by sending a prompt.</p>
        ) : (
          messages.map((message) => (
            <article key={message.id} className="chat-message">
              <strong>{message.role === "user" ? "You" : "Teacher"}</strong>
              <span>{message.content}</span>
            </article>
          ))
        )}
      </div>

      <label htmlFor="chat-input" style={{ display: "block", marginTop: "1rem" }}>
        Prompt
      </label>
      <textarea
        id="chat-input"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Ask for a lesson outline, code review checklist, or debugging tips..."
        disabled={isLoading}
      />
      <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem", alignItems: "center" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading}
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "12px",
            border: "none",
            background: isLoading ? "rgba(148, 163, 184, 0.2)" : "#38bdf8",
            color: isLoading ? "#cbd5f5" : "#0f172a",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          {isLoading ? "Streaming…" : "Send"}
        </button>
        {error && <span style={{ color: "#f97316" }}>⚠️ {error}</span>}
      </div>
    </section>
  );
}
