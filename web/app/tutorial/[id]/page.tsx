"use client";
import { useEffect, useState } from "react";
import "../../globals.css";

type Step = {
  id: number;
  step_order: number;
  title: string;
  content: string;
  code_template?: string | null;
  model_params?: any;
};

type Tutorial = {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: "poe" | "openai-compatible";
  difficulty: string;
  tags: string[];
  steps: Step[];
};

async function fetchTutorial(id: string): Promise<Tutorial> {
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
  const res = await fetch(`${base}/tutorial/${id}`, { cache: "no-store" });
  return res.json();
}

export default function TutorialPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [idx, setIdx] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTutorial(id).then((t) => {
      setTutorial(t);
      setPrompt(t?.steps?.[0]?.code_template || "");
    });
  }, [id]);

  async function run() {
    if (!tutorial) return;
    setOut("");
    setLoading(true);
    try {
      const resp = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: tutorial.provider,
          model: tutorial.model,
          messages: [{ role: "user", content: prompt }],
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
            const d = line.slice(5).trim();
            if (d === "[DONE]") break;
            try {
              const json = JSON.parse(d);
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

  if (!tutorial) return <div className="p-6">Loading...</div>;
  const step = tutorial.steps[idx];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <a className="text-blue-400 hover:underline" href="/tutorials">← Back</a>
      <h1 className="text-3xl font-bold">{tutorial.title}</h1>
      <p className="text-gray-400">{tutorial.description}</p>

      {tutorial.steps.length > 1 && (
        <div className="flex gap-2 mt-2">
          {tutorial.steps.map((s, i) => (
            <button
              key={s.id}
              className={`px-3 py-1 rounded ${i === idx ? "bg-blue-600 text-white" : "bg-gray-800"}`}
              onClick={() => {
                setIdx(i);
                setPrompt(tutorial.steps[i].code_template || "");
                setOut("");
              }}
            >
              Step {i + 1}
            </button>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{step.title}</h2>
          <div className="whitespace-pre-wrap text-gray-200">{step.content}</div>
          <textarea
            className="w-full min-h-32 p-3 bg-gray-900 rounded border border-gray-800"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={run}
            disabled={loading || !prompt.trim()}
          >
            {loading ? "Running..." : "Run step"}
          </button>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Output</h2>
          <pre className="min-h-64 p-3 bg-gray-900 rounded border border-gray-800 whitespace-pre-wrap">{out}</pre>
        </div>
      </div>
    </div>
  );
}

