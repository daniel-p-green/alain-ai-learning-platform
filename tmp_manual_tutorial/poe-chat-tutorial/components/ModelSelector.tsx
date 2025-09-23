"use client";

import { poeModels, type PoeModelId } from "@/lib/models";

export type ModelSelectorProps = {
  value: PoeModelId;
  onChange: (model: PoeModelId) => void;
  disabled?: boolean;
};

export function ModelSelector({ value, onChange, disabled }: ModelSelectorProps) {
  return (
    <label className="card" htmlFor="poe-model-selector">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong>Teacher Model</strong>
          <p style={{ margin: "0.25rem 0", color: "#94a3b8" }}>
            Switch between Poe-hosted teachers without reloading the page.
          </p>
        </div>
        <span className={`status-pill ${disabled ? "idle" : "active"}`}>
          {disabled ? "Locked" : "Live"}
        </span>
      </div>
      <select
        id="poe-model-selector"
        value={value}
        onChange={(event) => onChange(event.target.value as PoeModelId)}
        disabled={disabled}
        style={{
          marginTop: "0.75rem",
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          background: "rgba(15, 23, 42, 0.85)",
          color: "#f8fafc"
        }}
      >
        {poeModels.map((model) => (
          <option key={model.id} value={model.id}>
            {model.label} {model.recommended ? "· Recommended" : ""}
          </option>
        ))}
      </select>
      <ul style={{ marginTop: "0.75rem", paddingLeft: "1.25rem", color: "#94a3b8", fontSize: "0.95rem" }}>
        {poeModels.map((model) => (
          <li key={`${model.id}-details`}>
            <strong>{model.label}:</strong> {model.description}
          </li>
        ))}
      </ul>
    </label>
  );
}
