"use client";
import { useEffect, useState, useRef } from "react";
import { PromptCell } from "../../../components/PromptCell";
import { Button } from "../../../components/Button";
import { StreamingOutput } from "../../../components/StreamingOutput";
import { StepNav } from "../../../components/StepNav";
import { useAuth, useUser } from "@clerk/nextjs";

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
  const res = await fetch(`${base}/tutorials/${id}`, { cache: "no-store" });
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
  const [showRequest, setShowRequest] = useState(false);
  const [lastRequest, setLastRequest] = useState<any | null>(null);
  const [curl, setCurl] = useState<string>("");
  const [sdk, setSdk] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const providerStatus = providers.find((p:any)=> p.id===runProvider)?.status || 'unknown';
  const providerAvailable = providerStatus === 'available';
  // Editor handled by PromptCell component
  const [assessments, setAssessments] = useState<Array<{ id:number; question:string; options:string[] }>>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<{ correct: boolean; explanation?: string } | null>(null);
  const [adapted, setAdapted] = useState<string | null>(null);
  const [targetDifficulty, setTargetDifficulty] = useState<'beginner'|'intermediate'|'advanced'>('beginner');
  type ProviderModel = { id: string; name?: string };
  type ProviderInfo = { id: string; name: string; models?: ProviderModel[]; status?: string };
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [runProvider, setRunProvider] = useState<string>("poe");
  const [runModel, setRunModel] = useState<string>("");

  useEffect(() => {
    fetchTutorial(id).then((t) => {
      setTutorial(t);
      setPrompt(t?.steps?.[0]?.code_template || "");
      setRunProvider(t?.provider || 'poe');
      setRunModel(t?.model || '');
    });
  }, [id]);

  // Load providers for model suggestions
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch('/api/providers');
        const data = await resp.json();
        setProviders(data.providers || []);
      } catch (e) {
        // ignore for now in tutorial view; UI degrades gracefully
      }
    })();
  }, []);

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

  // Editor now lives in PromptCell

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
      if (!providerAvailable) {
        setToast('Provider not configured. Set keys in Settings.');
        setTimeout(()=> setToast(null), 2000);
        return;
      }
      const body = {
        provider: runProvider || tutorial.provider,
        model: runModel || tutorial.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
      };
      setLastRequest(body);
      const resp = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal,
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({ message: "Request failed" }));
        throw new Error(errorData.error?.message || `HTTP ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response stream");

      setToast('Streaming started');
      setTimeout(()=> setToast(null), 1200);
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

  // Build copyable code snippets
  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "";
    const payload = lastRequest || { provider: tutorial?.provider, model: tutorial?.model, messages: [{ role: 'user', content: prompt }], stream: false };
    const baseUrl = payload.provider === 'poe' ? 'https://api.poe.com/v1' : (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1');
    const keyVar = payload.provider === 'poe' ? 'POE_API_KEY' : 'OPENAI_API_KEY';
    const curlCmd = [
      `curl -s -X POST "${baseUrl}/chat/completions" \\\n`,
      `  -H "Authorization: Bearer $${keyVar}" \\\n`,
      `  -H "Content-Type: application/json" \\\n`,
      `  -d '${JSON.stringify({ model: payload.model, messages: payload.messages, stream: false, temperature: 0.7 })}'`
    ].join("");
    setCurl(curlCmd);
    const sdkJs = `import OpenAI from 'openai';\n\nconst client = new OpenAI({ apiKey: process.env.${keyVar}, baseURL: '${baseUrl}' });\nconst resp = await client.chat.completions.create({ model: '${payload.model}', messages: ${JSON.stringify(payload.messages)}, max_tokens: 400 });\nconsole.log(resp.choices[0].message.content);\n`;
    setSdk(sdkJs);
  }, [lastRequest, tutorial, prompt]);

  function cancelExecution() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }

  if (!tutorial) return <div className="p-6">Loading...</div>;
  const step = tutorial.steps[idx];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <a className="text-brand-blue hover:underline" href="/tutorials">← Back</a>
        <a className="text-xs text-gray-400 hover:underline" target="_blank" href={
          `https://gitlab.com/daniel-p-green/alain-ai-learning-platform/-/issues/new?issue%5Btitle%5D=Tutorial%20Issue:%20${encodeURIComponent(String(tutorial?.title||''))}&issue%5Bdescription%5D=${encodeURIComponent(`tutorial_id=${tutorial?.id}\nstep=${step?.step_order}`)}`
        }>Report issue</a>
      </div>
      <h1 className="text-3xl font-bold">{tutorial.title}</h1>
      <p className="text-gray-400">{tutorial.description}</p>

      {tutorial.model_maker && (
        <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-300">
          <div className="font-semibold text-white">Model Maker</div>
          <div>{tutorial.model_maker.name} ({tutorial.model_maker.org_type})</div>
          <div className="flex gap-2 mt-1">
            {tutorial.model_maker.homepage && <a className="text-brand-blue hover:underline" href={tutorial.model_maker.homepage} target="_blank">Homepage</a>}
            {tutorial.model_maker.repo && <a className="text-brand-blue hover:underline" href={tutorial.model_maker.repo} target="_blank">Repo</a>}
            {tutorial.model_maker.license && <span className="text-gray-400">License: {tutorial.model_maker.license}</span>}
          </div>
        </div>
      )}

      {tutorial.steps.length > 1 && (
        <StepNav
          steps={tutorial.steps.map(s => ({ id: s.id, step_order: s.step_order, title: s.title }))}
          currentStep={idx}
          onStepChange={(i) => { setIdx(i); setPrompt(tutorial.steps[i].code_template || ""); setOut(""); }}
        />
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
          {/* Provider/model picker for run-time */}
          <div className="flex items-center gap-2 text-sm">
            <select className="px-2 py-1 rounded bg-gray-800 border border-gray-700" value={runProvider} onChange={(e)=> setRunProvider(e.target.value)}>
              {providers.map((p)=> (<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
            <select className="px-2 py-1 rounded bg-gray-800 border border-gray-700" value={runModel} onChange={(e)=> setRunModel(e.target.value)}>
              <option value="">{tutorial?.model || 'Model'}</option>
              {(providers.find((p)=> p.id===runProvider)?.models || []).map((m)=> (
                <option key={m.id} value={m.id}>{m.name || m.id}</option>
              ))}
            </select>
          </div>

          {/* Provider status banner */}
          {!providerAvailable && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-2 text-sm text-red-300">
              Provider not configured. Set keys in Settings and pick a working provider/model.
            </div>
          )}

          {/* Prompt editor and controls */}
          <PromptCell
            codeTemplate={prompt}
            onChange={(v) => setPrompt(v)}
            onExecute={run}
            disabled={executionState.status === 'running' || !prompt.trim()}
          />
          {executionState.status === 'running' && (
            <Button className="mt-2" variant="danger" onClick={cancelExecution}>Cancel</Button>
          )}

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
                    <Button
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
                    >Submit</Button>
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

          {/* Experience Adaptation */}
          <div className="bg-gray-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Adapt Experience</h3>
              <div className="flex items-center gap-2 text-sm">
                <label className="text-gray-300">Target</label>
                <select className="px-2 py-1 rounded bg-gray-900 border border-gray-700" value={targetDifficulty} onChange={(e)=> setTargetDifficulty(e.target.value as any)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <Button
                  className="px-3 py-1.5"
                  onClick={async ()=>{
                    const score = assessmentResult ? (assessmentResult.correct ? 80 : 40) : 60;
                    const resp = await fetch('/api/adapt', {
                      method:'POST',
                      headers:{'Content-Type':'application/json'},
                      body: JSON.stringify({
                        tutorialId: tutorial.id,
                        stepOrder: step.step_order,
                        current_content: step.content,
                        user_performance: score,
                        target_difficulty: targetDifficulty,
                        provider: 'poe'
                      })
                    });
                    const data = await resp.json();
                    if (data.success && data.adapted) setAdapted(data.adapted);
                  }}
                  variant="primary"
                >Adapt</Button>
              </div>
            </div>
            {adapted && (
              <div className="mt-1 p-3 rounded border border-indigo-700 bg-indigo-900/10">
                <div className="text-sm text-indigo-300 font-medium mb-1">Adapted for {targetDifficulty}</div>
                <div className="whitespace-pre-wrap text-indigo-100">{adapted}</div>
              </div>
            )}
            <div className="text-xs text-gray-500">Uses teacher model; original content remains unchanged.</div>
          </div>

          {/* Progress */}
          {user && (
            <Button
              variant="secondary"
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
            >Mark Step Complete</Button>
          )}
        </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Output</h2>
          <div className="flex items-center gap-2">
            <Button
              className="text-xs px-2 py-1"
              onClick={() => setShowRequest(!showRequest)}
              variant="secondary"
            >
              {showRequest ? 'Hide Request' : 'Show Request'}
            </Button>
            {executionState.status === 'completed' && (
              <span className="text-sm text-green-400 font-medium">✓ Completed</span>
            )}
            {executionState.status === 'cancelled' && (
              <span className="text-sm text-yellow-400 font-medium">⏹ Cancelled</span>
            )}
          </div>
        </div>

        {showRequest && (
          <div className="text-xs bg-gray-900 border border-gray-800 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-gray-400">Last request payload</div>
              <Button className="px-2 py-0.5" variant="secondary" onClick={() => navigator.clipboard.writeText(JSON.stringify(lastRequest || {}, null, 2))}>Copy JSON</Button>
            </div>
            <pre className="whitespace-pre-wrap text-gray-300">{JSON.stringify(lastRequest || {}, null, 2)}</pre>
          </div>
        )}
        <StreamingOutput
          output={out || (executionState.status === 'idle' ? 'Click "Run step" to execute your prompt...' : '')}
          isStreaming={executionState.status === 'running'}
          error={executionState.status === 'error' ? executionState.error || null : null}
          elapsedSeconds={getElapsedTime()}
          tokenCount={executionState.tokenCount}
          status={executionState.status === 'error' ? 'error' : executionState.status === 'completed' ? 'success' : executionState.status === 'running' ? 'info' : 'idle'}
        />

          {/* Copy helpers */}
          <div className="bg-gray-900 border border-gray-800 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-300">Copy as</div>
              <div className="flex gap-2">
                <Button className="px-2 py-1 text-xs" variant="secondary" onClick={() => navigator.clipboard.writeText(curl)}>curl</Button>
                <Button className="px-2 py-1 text-xs" variant="secondary" onClick={() => navigator.clipboard.writeText(sdk)}>OpenAI SDK (JS)</Button>
              </div>
            </div>
            <pre className="text-xs whitespace-pre-wrap text-gray-400">{curl}</pre>
          </div>

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
                <div className="col-span-2">
                  <span className="text-gray-400">Est. Cost:</span>
                  <CostHint provider={runProvider} model={runModel || tutorial.model} tokens={executionState.tokenCount || 0} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Colab Export */}
      <div>
        <Button
          variant="secondary"
          onClick={async () => {
            const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
            const res = await fetch(`${base}/export/colab/${tutorial!.id}`);
            const nb = await res.json();
            const ***REMOVED*** = new Blob([JSON.stringify(nb, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(***REMOVED***);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${tutorial!.title.replace(/\s+/g,'_')}.ipynb`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
          }}
        >Download Colab Notebook</Button>
        <div className="text-xs text-gray-500 mt-2">
          Tip: To open in Google Colab, visit <a className="text-brand-blue hover:underline" href="https://colab.research.google.com" target="_blank">colab.research.google.com</a> and choose "Upload" to select the downloaded <code>.ipynb</code>. The first cells include provider setup and a quick smoke test.
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded bg-gray-900 border border-gray-700 text-white shadow">{toast}</div>
      )}
    </div>
  );
}

function CostHint({ provider, model, tokens }: { provider: string; model: string; tokens: number }) {
  // Very rough cost map (USD per 1K tokens)
  const COSTS: Record<string, { in?: number; out?: number }> = {
    'gpt-4o': { in: 0.005, out: 0.015 },
    'gpt-4o-mini': { in: 0.00015, out: 0.0006 },
    'gpt-4-turbo': { in: 0.01, out: 0.03 },
  };
  const key = (model || '').toLowerCase();
  const c = COSTS[key];
  if (!c) return <div className="text-white font-mono">N/A</div>;
  const cost = (tokens / 1000) * ((c.in || 0) + (c.out || 0));
  return (
    <div className="text-white font-mono inline-flex items-center gap-2">
      ~${cost.toFixed(4)}
      <span className="text-xs text-gray-500" title="Rough estimate; varies by provider and direction.">ⓘ</span>
    </div>
  );
}
