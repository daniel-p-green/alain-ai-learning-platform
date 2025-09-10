"use client";
import { useRef, useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Button } from "../../components/Button";
import { StreamingOutput } from "../../components/StreamingOutput";

export default function StreamDemo() {
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  async function run() {
    setOut("");
    setError(null);
    setLoading(true);
    startTimeRef.current = Date.now();
    const timer = setInterval(() => {
      if (startTimeRef.current) setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 250);
    try {
      const resp = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openai-compatible",
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: "Write a haiku about Next.js." }],
          stream: true,
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("Request failed");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const line = chunk.trim();
          if (!line) continue;
          if (line.startsWith("data:")) {
            const dataStr = line.slice(5).trim();
            if (dataStr === "[DONE]") break;
            try {
              const json = JSON.parse(dataStr);
              const delta = json?.choices?.[0]?.delta?.content ?? json?.choices?.[0]?.message?.content ?? "";
              setOut((prev) => prev + (delta || ""));
            } catch {}
          }
        }
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
      clearInterval(timer);
      startTimeRef.current = null;
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Streaming Demo</h1>
        <p className="text-gray-500 text-sm">Runs a small prompt and streams the model output in real time.</p>
      </div>
      <SignedOut>
        <div className="text-gray-300">
          Please sign in to run the demo. <SignInButton />
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center gap-2">
          <Button disabled={loading} onClick={run}>{loading ? "Running…" : "Run"}</Button>
          <Button variant="secondary" disabled={loading || !out} onClick={()=> setOut("")}>Clear</Button>
        </div>
        <StreamingOutput
          output={out}
          isStreaming={loading}
          error={error ? { code: "request", message: error } : null}
          elapsedSeconds={elapsed}
          tokenCount={undefined}
          status={error ? 'error' : (loading ? 'info' : (out ? 'success' : 'idle'))}
        />
      </SignedIn>
    </div>
  );
}
