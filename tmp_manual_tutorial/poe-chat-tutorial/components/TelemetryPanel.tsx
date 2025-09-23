"use client";

import type { ChatTelemetry } from "@/lib/telemetry";

export type TelemetryPanelProps = {
  entries: ChatTelemetry[];
};

export function TelemetryPanel({ entries }: TelemetryPanelProps) {
  if (entries.length === 0) {
    return (
      <section className="card">
        <strong>Telemetry</strong>
        <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
          Messages you send will log latency and tokens once the teacher replies.
        </p>
      </section>
    );
  }

  return (
    <section className="card">
      <header>
        <strong>Telemetry</strong>
        <p style={{ marginTop: "0.25rem", color: "#94a3b8" }}>
          Every turn records latency, token usage, and failure states. Use this to spot slow or failing models.
        </p>
      </header>
      <ul className="telemetry-list" style={{ marginTop: "1rem" }}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 600 }}>{entry.model}</span>
              <span className={`status-pill ${entry.status === "success" ? "active" : "idle"}`}>
                {entry.status === "success" ? "Success" : "Error"}
              </span>
            </div>
            <dl style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.5rem", marginTop: "0.75rem", fontSize: "0.85rem" }}>
              <div>
                <dt style={{ color: "#94a3b8", fontSize: "0.7rem", textTransform: "uppercase" }}>Latency</dt>
                <dd style={{ margin: 0 }}>{entry.latencyMs} ms</dd>
              </div>
              <div>
                <dt style={{ color: "#94a3b8", fontSize: "0.7rem", textTransform: "uppercase" }}>Tokens</dt>
                <dd style={{ margin: 0 }}>{entry.totalTokens} total</dd>
              </div>
              <div>
                <dt style={{ color: "#94a3b8", fontSize: "0.7rem", textTransform: "uppercase" }}>Started</dt>
                <dd style={{ margin: 0 }}>{new Date(entry.startedAt).toLocaleTimeString()}</dd>
              </div>
            </dl>
            {entry.errorMessage ? (
              <p style={{ marginTop: "0.5rem", color: "#f97316" }}>⚠️ {entry.errorMessage}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
