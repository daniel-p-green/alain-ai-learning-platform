"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
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
  model_maker?: { name:string; org_type:string; homepage?:string|null; license?:string|null; repo?:string|null } | null;
};

type StreamError = {
  code: string;
  message: string;
  details?: any;
};

type ExecutionState = {
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  startTime?: number;
  tokenCount?: number;
  error?: StreamError;
};

async function fetchTutorial(id: string): Promise<Tutorial> {
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
  const res = await fetch(`${base}/tutorial/${id}`, { cache: "no-store" });
  return res.json();
}

export default function TutorialPage({ params }: { params: { id: string } }) {
  const id = params.id;
  const { getToken } = useAuth();
  const { user } = useUser();
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [idx, setIdx] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState("");
  const [executionState, setExecutionState] = useState<ExecutionState>({ status: 'idle' });
  const abortControllerRef = useRef<AbortController | null>(null);
  const monacoRef = useRef<HTMLDivElement | null>(null);
  const monacoEditorRef = useRef<any>(null);
  const [monacoReady, setMonacoReady] = useState(false);
  const [assessments, setAssessments] = useState<Array<{ id:number; question:string; options:string[] }>>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<{ correct: boolean; explanation?: string } | null>(null);

  useEffect(() => {
    fetchTutorial(id).then((t) => {
      setTutorial(t);
      setPrompt(t?.steps?.[0]?.code_template || "");
    });
  }, [id]);

  // Load assessments for current step
  useEffect(() => {
    async function loadAssessments() {
      if (!tutorial) return;
      const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
      const step = tutorial.steps[idx];
      const url = new URL(`${base}/assessments/${tutorial.id}`);
      url.searchParams.set("stepOrder", String(step.step_order));
      const res = await fetch(url.toString(), { cache: "no-store" });
      const data = await res.json();
      setAssessments(data.assessments || []);
      setChoice(null);
      setAssessmentResult(null);
    }
    loadAssessments();
  }, [tutorial, idx]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Monaco editor lazy init
  useEffect(() => {
    let disposed = false;
    async function init() {
      if (!monacoRef.current || monacoEditorRef.current) return;
      try {
        const monaco = await import('monaco-editor');
        if (disposed) return;
        monacoEditorRef.current = monaco.editor.create(monacoRef.current!, {
          value: prompt || '',
          language: 'markdown',
          theme: 'vs-dark',
          automaticLayout: true,
          minimap: { enabled: false },
        });
        monacoEditorRef.current.onDidChangeModelContent(() => {
          const v = monacoEditorRef.current.getValue();
          setPrompt(v);
        });
        setMonacoReady(true);
      } catch {}
    }
    init();
    return () => {
      disposed = true;
      if (monacoEditorRef.current) {
        monacoEditorRef.current.dispose();
        monacoEditorRef.current = null;
      }
    };
  }, [prompt]);

  // Calculate elapsed time
  const getElapsedTime = () => {
    if (!executionState.startTime) return 0;
    return Math.floor((Date.now() - executionState.startTime) / 1000);
  };

  // Format time display
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  async function run() {
    if (!tutorial) return;

    // Cancel any existing execution
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setOut("");
    setExecutionState({
      status: 'running',
      startTime: Date.now(),
      tokenCount: 0
    });

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
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ message: "Request failed" }));
        throw new Error(errorData.error?.message || `HTTP ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let totalTokens = 0;

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

            if (d === "[DONE]") {
              setExecutionState(prev => ({
                ...prev,
                status: 'completed',
                tokenCount: totalTokens
              }));
              break;
            }

            try {
              const json = JSON.parse(d);

              // Check for error events
              if (json.event === 'error' || json.error) {
                throw new Error(json.error?.message || json.message || "Stream error");
              }

              // Extract content
              const delta = json?.choices?.[0]?.delta?.content ??
                           json?.choices?.[0]?.message?.content ?? "";

              if (delta) {
                setOut((prev) => prev + delta);
                totalTokens += delta.length; // Rough token estimate
                setExecutionState(prev => ({ ...prev, tokenCount: totalTokens }));
              }
            } catch (parseError) {
              // If JSON parsing fails, it might be an error message
              if (d.includes("error") || d.includes("Error")) {
                throw new Error(d);
              }
            }
          }
        }
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setExecutionState(prev => ({ ...prev, status: 'cancelled' }));
        setOut("Execution cancelled");
      } else {
        const error: StreamError = {
          code: e.message.includes('401') ? 'authentication_failed' :
                e.message.includes('429') ? 'rate_limited' :
                e.message.includes('404') ? 'model_not_found' : 'execution_error',
          message: e.message || "Execution failed",
          details: e
        };

        setExecutionState(prev => ({
          ...prev,
          status: 'error',
          error
        }));
        setOut(`Error: ${error.message}`);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }

  function cancelExecution() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  if (!tutorial) return <div className="p-6">Loading...</div>;
  const step = tutorial.steps[idx];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <a className="text-blue-400 hover:underline" href="/tutorials">← Back</a>
      <h1 className="text-3xl font-bold">{tutorial.title}</h1>
      <p className="text-gray-400">{tutorial.description}</p>

      {tutorial.model_maker && (
        <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300">
          <div className="font-semibold text-white">Model Maker</div>
          <div>{tutorial.model_maker.name} ({tutorial.model_maker.org_type})</div>
          <div className="flex gap-2 mt-1">
            {tutorial.model_maker.homepage && <a className="text-blue-400 hover:underline" href={tutorial.model_maker.homepage} target="_blank">Homepage</a>}
            {tutorial.model_maker.repo && <a className="text-blue-400 hover:underline" href={tutorial.model_maker.repo} target="_blank">Repo</a>}
            {tutorial.model_maker.license && <span className="text-gray-400">License: {tutorial.model_maker.license}</span>}
          </div>
        </div>
      )}

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

      {/* Error Banner */}
      {executionState.status === 'error' && executionState.error && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 text-red-400">⚠️</div>
            <div>
              <h3 className="font-semibold text-red-400">
                {executionState.error.code === 'rate_limited' && 'Rate Limited'}
                {executionState.error.code === 'authentication_failed' && 'Authentication Failed'}
                {executionState.error.code === 'model_not_found' && 'Model Not Found'}
                {executionState.error.code === 'execution_error' && 'Execution Error'}
              </h3>
              <p className="text-sm text-red-300">{executionState.error.message}</p>
              {executionState.error.code === 'rate_limited' && (
                <p className="text-xs text-red-400 mt-1">Try again in a few moments</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">{step.title}</h2>
          <div className="whitespace-pre-wrap text-gray-200">{step.content}</div>

          {/* Execution Status Bar */}
          {executionState.status !== 'idle' && (
            <div className="bg-gray-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Status:</span>
                <span className={`font-medium ${
                  executionState.status === 'running' ? 'text-blue-400' :
                  executionState.status === 'completed' ? 'text-green-400' :
                  executionState.status === 'error' ? 'text-red-400' :
                  executionState.status === 'cancelled' ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {executionState.status === 'running' && 'Running...'}
                  {executionState.status === 'completed' && 'Completed'}
                  {executionState.status === 'error' && 'Error'}
                  {executionState.status === 'cancelled' && 'Cancelled'}
                </span>
              </div>

              {executionState.status === 'running' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Time:</span>
                    <span className="text-blue-400 font-mono">{formatTime(getElapsedTime())}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">Tokens:</span>
                    <span className="text-blue-400 font-mono">~{executionState.tokenCount || 0}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Monaco editor (fallback to textarea) */}
          <div className="h-48 border border-gray-800 rounded" ref={monacoRef} style={{ display: monacoReady ? 'block' : 'none' }} />
          {!monacoReady && (
            <textarea
              className="w-full min-h-32 p-3 bg-gray-900 rounded border border-gray-800 focus:border-blue-500 focus:outline-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
            />
          )}

          <div className="flex gap-2">
            <button
              className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={run}
              disabled={executionState.status === 'running' || !prompt.trim()}
            >
              {executionState.status === 'running' ? 'Running...' : 'Run step'}
            </button>

            {executionState.status === 'running' && (
              <button
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                onClick={cancelExecution}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Assessments */}
          {assessments.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-3 space-y-3">
              <h3 className="font-semibold">Quick Check</h3>
              {assessments.map((a) => (
                <div key={a.id} className="space-y-2">
                  <div className="text-gray-200">{a.question}</div>
                  <div className="space-y-1">
                    {a.options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="radio"
                          name={`a-${a.id}`}
                          checked={choice === i}
                          onChange={() => setChoice(i)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
                      disabled={choice == null}
                      onClick={async () => {
                        const token = await getToken();
                        const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
                        const resp = await fetch(`${base}/assessments/validate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                          body: JSON.stringify({ assessmentId: a.id, choice })
                        });
                        const data = await resp.json();
                        setAssessmentResult(data);
                      }}
                    >
                      Submit
                    </button>
                    {assessmentResult && (
                      <span className={assessmentResult.correct ? 'text-green-400' : 'text-red-400'}>
                        {assessmentResult.correct ? 'Correct!' : 'Incorrect'}
                      </span>
                    )}
                  </div>
                  {assessmentResult?.explanation && (
                    <div className="text-xs text-gray-400">{assessmentResult.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {user && (
            <button
              className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
              onClick={async () => {
                const token = await getToken();
                const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
                await fetch(`${base}/progress`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({
                    userId: user.id,
                    tutorialId: tutorial!.id,
                    currentStep: tutorial!.steps[idx].step_order,
                    completedSteps: tutorial!.steps.slice(0, idx + 1).map(s => s.step_order)
                  })
                });
              }}
            >
              Mark Step Complete
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Output</h2>
            {executionState.status === 'completed' && (
              <span className="text-sm text-green-400 font-medium">✓ Completed</span>
            )}
            {executionState.status === 'cancelled' && (
              <span className="text-sm text-yellow-400 font-medium">⏹ Cancelled</span>
            )}
          </div>

          <pre className={`min-h-64 p-3 bg-gray-900 rounded border whitespace-pre-wrap ${
            executionState.status === 'error' ? 'border-red-700' :
            executionState.status === 'completed' ? 'border-green-700' :
            executionState.status === 'running' ? 'border-blue-700' : 'border-gray-800'
          }`}>
            {out || (executionState.status === 'idle' ? 'Click "Run step" to execute your prompt...' : '')}
          </pre>

          {/* Budget Indicators */}
          {executionState.status === 'completed' && executionState.tokenCount && (
            <div className="bg-gray-800 rounded-lg p-3 space-y-2">
              <h4 className="font-medium text-gray-300">Execution Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <div className="text-white font-mono">{formatTime(getElapsedTime())}</div>
                </div>
                <div>
                  <span className="text-gray-400">Est. Tokens:</span>
                  <div className="text-white font-mono">~{executionState.tokenCount}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Colab Export */}
      <div>
        <button
          className="px-4 py-2 rounded bg-gray-800 hover:bg-gray-700 text-white"
          onClick={async () => {
            const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
            const res = await fetch(`${base}/export/colab/${tutorial!.id}`);
            const nb = await res.json();
            const blob = new Blob([JSON.stringify(nb, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tutorial!.title.replace(/\s+/g,'_')}.ipynb`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >
          Download Colab Notebook
        </button>
      </div>
    </div>
  );
}
