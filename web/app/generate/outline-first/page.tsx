"use client";
import { useEffect, useRef, useState } from "react";

export default function OutlineFirstGeneratorPage() {
  const [model, setModel] = useState("gpt-oss-20b");
  const [difficulty, setDifficulty] = useState<"beginner"|"intermediate"|"advanced">("beginner");
  const [maxSections, setMaxSections] = useState(8);
  const [running, setRunning] = useState(false);
  const [messages, setMessages] = useState<Array<{phase:string; text:string}>>([]);
  const [sections, setSections] = useState<Array<{ index:number; title:string; done:boolean }>>([]);
  const [notebook, setNotebook] = useState<any>(null);
  const esRef = useRef<EventSource | null>(null);

  function append(phase: string, text: string) {
    setMessages(prev => [...prev, { phase, text }]);
  }

  function start() {
    if (running) return;
    setRunning(true);
    setMessages([]);
    setSections([]);
    setNotebook(null);
    const url = `/api/generate/stream?model=${encodeURIComponent(model)}&difficulty=${encodeURIComponent(difficulty)}&maxSections=${maxSections}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("status", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        if (data.phase === "start") {
          append("start", `Starting generation (model=${data.model}, difficulty=${data.difficulty})`);
        } else if (data.phase === "outline.start") {
          append("outline", "Generating outline...");
        } else if (data.phase === "outline.done") {
          append("outline", `Outline ready (${data.steps} steps): ${data.title || "(untitled)"}`);
        } else if (data.phase === "section.start") {
          const idx = Number(data.index);
          const title = String(data.h2 || `Step ${idx}`);
          setSections(prev => {
            const next = [...prev];
            // ensure capacity
            if (!next.find(s => s.index === idx)) next.push({ index: idx, title, done: false });
            return next;
          });
          append("section", `Section ${idx}/${data.of}: ${title}`);
        } else if (data.phase === "section.done") {
          const idx = Number(data.index);
          const title = String(data.title || `Step ${idx}`);
          setSections(prev => prev.map(s => s.index === idx ? { ...s, title, done: true } : s));
        } else if (data.phase === "assemble.start") {
          append("assemble", "Assembling notebook...");
        }
      } catch (e) {
        // ignore parse errors
      }
    });

    es.addEventListener("complete", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        setNotebook(data.notebook);
        append("complete", "Notebook ready.");
      } finally {
        es.close();
        setRunning(false);
      }
    });

    es.addEventListener("error", (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data || "{}");
        append("error", data.error || "Unknown error");
      } catch {
        append("error", "Stream error");
      }
      es.close();
      setRunning(false);
    });
  }

  function stop() {
    esRef.current?.close();
    esRef.current = null;
    setRunning(false);
    append("stopped", "Stopped by user.");
  }

  function downloadNotebook() {
    if (!notebook) return;
    const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alain-notebook-${Date.now()}.ipynb`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function downloadBundle() {
    if (!notebook) return;
    try {
      const resp = await fetch('/api/generate/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notebook, filename: `alain-notebook-${Date.now()}.ipynb` })
      })
      if (!resp.ok) {
        append('error', `Bundle failed: ${resp.status}`)
        return
      }
      const blob = await resp.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alain-bundle-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e:any) {
      append('error', `Bundle error: ${e?.message || e}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">ALAIN‑Kit — Outline‑First Notebook Generator</h1>
      <div className="space-y-4 border rounded-md p-4 bg-white shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="flex flex-col text-sm">
            <span className="text-ink-600 mb-1">Model</span>
            <input value={model} onChange={e=>setModel(e.target.value)} className="border rounded px-2 py-1" placeholder="gpt-oss-20b" />
          </label>
          <label className="flex flex-col text-sm">
            <span className="text-ink-600 mb-1">Difficulty</span>
            <select value={difficulty} onChange={e=>setDifficulty(e.target.value as any)} className="border rounded px-2 py-1">
              <option value="beginner">beginner</option>
              <option value="intermediate">intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </label>
          <label className="flex flex-col text-sm">
            <span className="text-ink-600 mb-1">Max Sections</span>
            <input type="number" min={6} max={12} value={maxSections} onChange={e=>setMaxSections(Number(e.target.value||8))} className="border rounded px-2 py-1" />
          </label>
        </div>
        <div className="flex items-center gap-3">
          {!running && <button onClick={start} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded">Start</button>}
          {running && <button onClick={stop} className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-2 rounded">Stop</button>}
          {notebook && <>
            <button onClick={downloadNotebook} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-2 rounded">Download .ipynb</button>
            <button onClick={downloadBundle} className="bg-emerald-700 hover:bg-emerald-800 text-white text-sm px-3 py-2 rounded">Download Bundle (.zip)</button>
          </>}
        </div>
      </div>

      {sections.length > 0 && (
        <div className="mt-6">
          <h2 className="font-medium mb-2">Sections</h2>
          <ul className="space-y-1">
            {sections.sort((a,b)=>a.index-b.index).map(s => (
              <li key={s.index} className="text-sm flex items-center gap-2">
                <span className={`inline-block w-2 h-2 rounded-full ${s.done ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <span className="text-ink-800">{s.index}.</span>
                <span className="text-ink-700 truncate">{s.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-6">
          <h2 className="font-medium mb-2">Activity</h2>
          <div className="text-sm bg-ink-50 border rounded p-3 max-h-64 overflow-auto">
            {messages.map((m, i) => (
              <div key={i} className="mb-1"><span className="text-ink-600">[{m.phase}]</span> {m.text}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
