"use client";
import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function StreamDemo() {
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    setOut("");
    setLoading(true);
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
      if (!resp.ok || !resp.body) throw new Error("request failed");
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
      setOut(`Error: ${e?.message || String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Streaming Demo</h1>
      <SignedOut>
        <p>Please sign in to run the demo.</p>
        <SignInButton />
      </SignedOut>
      <SignedIn>
        <button disabled={loading} onClick={run}>
          {loading ? "Running..." : "Run"}
        </button>
      </SignedIn>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>{out}</pre>
    </div>
  );
}

