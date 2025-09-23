"use client";

import { useMemo, useState } from "react";
import { ModelSelector } from "@/components/ModelSelector";
import { ChatWindow } from "@/components/ChatWindow";
import { TelemetryPanel } from "@/components/TelemetryPanel";
import { poeModels, type PoeModelId } from "@/lib/models";
import type { ChatTelemetry } from "@/lib/telemetry";

const defaultModel: PoeModelId = (process.env.NEXT_PUBLIC_POE_DEFAULT_MODEL as PoeModelId) ?? "gpt-oss-20b";

export default function HomePage() {
  const [model, setModel] = useState<PoeModelId>(defaultModel);
  const [telemetry, setTelemetry] = useState<ChatTelemetry[]>([]);

  const selectedModel = useMemo(() => poeModels.find((item) => item.id === model) ?? poeModels[0], [model]);

  return (
    <>
      <section className="card">
        <header>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Poe Multi-Model Chat Tutorial</h1>
          <p style={{ color: "#94a3b8" }}>
            This playground mirrors the experience we build in the tutorial notebook: choose a Poe-hosted teacher, send prompts, stream responses, and verify telemetry.
          </p>
        </header>
        <div className="callout warning" style={{ marginTop: "1rem" }}>
          <strong>Warning:</strong> Set <code>POE_API_KEY</code> in your environment before running <code>npm run dev</code>. Without it the API route will fall back to a dummy response and telemetry will mark failures.
        </div>
        <ul style={{ marginTop: "1rem", paddingLeft: "1.25rem", color: "#94a3b8" }}>
          <li>✅ Client uses the OpenAI SDK pointed at <code>https://api.poe.com/v1</code>.</li>
          <li>✅ Model selector is type-safe and guards unsupported values server-side.</li>
          <li>✅ Telemetry panel captures latency, tokens, and error reasons for each turn.</li>
        </ul>
      </section>

      <ModelSelector value={model} onChange={setModel} disabled={false} />

      <ChatWindow
        model={model}
        onTelemetry={(entry) => setTelemetry((current) => [entry, ...current.slice(0, 19)])}
      />

      <TelemetryPanel entries={telemetry} />

      <section className="card">
        <strong>Why this matters</strong>
        <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
          Being able to flip between ten teachers in one UI is critical when product, enablement, and safety teams need to vet trade-offs quickly. The telemetry view highlights slow or failing models so you can update runbooks before launch.
        </p>
      </section>

      <section className="card">
        <strong>Try this next</strong>
        <ol style={{ marginTop: "0.5rem", color: "#94a3b8", paddingLeft: "1.25rem" }}>
          <li>Add a temperature slider that pipes through to the API route.</li>
          <li>Persist telemetry entries to <code>localStorage</code> so refreshes keep history.</li>
          <li>Forward telemetry events to your analytics provider for cross-team dashboards.</li>
        </ol>
      </section>
    </>
  );
}
