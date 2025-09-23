from __future__ import annotations

import json
import textwrap
from pathlib import Path

BASE = Path("tmp_manual_tutorial")
PROJECT = BASE / "poe-chat-tutorial"
SECTIONS_DIR = BASE / "sections"

SECTIONS_DIR.mkdir(exist_ok=True)


def bash_write_files(file_map: dict[str, str], ensure_dirs: list[str] | None = None) -> str:
    lines = ["%%bash", "set -euo pipefail"]
    if ensure_dirs:
        for directory in ensure_dirs:
            lines.append(f"mkdir -p {directory}")
    for relative_path, contents in file_map.items():
        rel = relative_path.replace("\\", "/")
        lines.append(f"cat <<'EOF' > {rel}")
        lines.append(contents.rstrip("\n"))
        lines.append("EOF")
    return "\n".join(lines)


def load(path: str) -> str:
    data = (PROJECT / path).read_text()
    return data.strip("\n")

PAGE_STEP3 = textwrap.dedent(
    """
    "use client";

    import { useState } from "react";
    import { ModelSelector } from "@/components/ModelSelector";
    import type { PoeModelId } from "@/lib/models";

    const defaultModel: PoeModelId = (process.env.NEXT_PUBLIC_POE_DEFAULT_MODEL as PoeModelId) ?? "gpt-oss-20b";

    export default function HomePage() {
      const [model, setModel] = useState<PoeModelId>(defaultModel);

      return (
        <>
          <section className="card">
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Pick your Poe teacher</h1>
            <p style={{ color: "#94a3b8" }}>
              This tutorial focuses on building a multi-model chat experience. First, confirm the selector renders and updates local state.
            </p>
          </section>

          <ModelSelector value={model} onChange={setModel} disabled={false} />

          <section className="card">
            <strong>Preview</strong>
            <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
              Current selection: <code>{model}</code>. In the next step we'll wire the streaming chat UI for this model.
            </p>
          </section>
        </>
      );
    }
    """
).strip()

PAGE_STEP4 = textwrap.dedent(
    """
    "use client";

    import { useState } from "react";
    import { ModelSelector } from "@/components/ModelSelector";
    import { ChatWindow } from "@/components/ChatWindow";
    import type { PoeModelId } from "@/lib/models";
    import type { ChatTelemetry } from "@/lib/telemetry";

    const defaultModel: PoeModelId = (process.env.NEXT_PUBLIC_POE_DEFAULT_MODEL as PoeModelId) ?? "gpt-oss-20b";

    export default function HomePage() {
      const [model, setModel] = useState<PoeModelId>(defaultModel);
      const [lastTelemetry, setLastTelemetry] = useState<ChatTelemetry | null>(null);

      return (
        <>
          <section className="card">
            <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Stream Poe Responses</h1>
            <p style={{ color: "#94a3b8" }}>
              Send a prompt to the selected teacher and watch streaming text arrive directly in the UI.
            </p>
          </section>

          <ModelSelector value={model} onChange={setModel} disabled={false} />

          <ChatWindow model={model} onTelemetry={setLastTelemetry} />

          <section className="card">
            <strong>Latest Telemetry</strong>
            <p style={{ marginTop: "0.5rem", color: "#94a3b8" }}>
              {lastTelemetry ? (
                <span>
                  {lastTelemetry.model} · {lastTelemetry.latencyMs} ms · tokens: {lastTelemetry.totalTokens}
                </span>
              ) : (
                <span>No telemetry yet. Send a prompt to populate this block.</span>
              )}
            </p>
          </section>
        </>
      );
    }
    """
).strip()

PAGE_FINAL = load("app/page.tsx")

sections = [
    {
        "section_number": 1,
        "title": "Step 1: Map the Experience and Requirements",
        "estimated_tokens": 320,
        "callouts": [
            {
                "type": "note",
                "message": "Keep the tutorial focused on the end-to-end journey: from setup to telemetry."
            }
        ],
        "content": [
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    ## Step 1: Map the Experience and Requirements

                    Before touching code, capture the shape of the tutorial:

                    - **Audience:** React + TypeScript engineers who can run Next.js locally but need Poe-specific guidance.
                    - **North Star:** A streaming chat playground that switches between ten Poe-hosted teachers with telemetry on every turn.
                    - **Success Criteria:** No placeholders, reproducible setup commands, and observable telemetry (latency + tokens + failures).

                    We also lock the brief so future contributors understand scope:

                    - Target model roster: GPT-OSS-20B/120B, GPT-5, GPT-5 Chat, Claude 3.5 Sonnet, Claude Opus 4.1, Gemini 2.5 Pro, Grok 3, Mixtral 8x22B, Llama 3.1 405B.
                    - Streaming transport: Poe via the OpenAI SDK (`baseURL="https://api.poe.com/v1"`).
                    - Telemetry surface: client-side store rendered in the UI—no database required, but easy to extend later.

                    > 🗂️ Save these as working notes (`tmp_manual_tutorial/chat-poe-brief.md`) so the instructional context ships with the repo.
                    """
                ).strip()
            }
        ]
    }
]

# Step 2 files
step2_files = {
    "poe-chat-tutorial/package.json": load("package.json"),
    "poe-chat-tutorial/tsconfig.json": load("tsconfig.json"),
    "poe-chat-tutorial/next.config.mjs": load("next.config.mjs"),
    "poe-chat-tutorial/next-env.d.ts": load("next-env.d.ts"),
    "poe-chat-tutorial/.eslintrc.json": load(".eslintrc.json"),
    "poe-chat-tutorial/app/globals.css": load("app/globals.css"),
    "poe-chat-tutorial/app/layout.tsx": load("app/layout.tsx"),
}

sections.append(
    {
        "section_number": 2,
        "title": "Step 2: Scaffold the Project and Wire Poe",
        "estimated_tokens": 420,
        "callouts": [
            {
                "type": "tip",
                "message": "Pin `openai` ≥ 4.57.0; earlier builds lack the streaming helpers used here."
            }
        ],
        "content": [
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    ### Why this step matters

                    We need a reproducible Next.js workspace with TypeScript, ESLint, and the OpenAI SDK already pointing at Poe. The cell below bootstraps the project and writes the base config files we will extend in later steps.

                    Make sure you run this from a clean directory (the script creates `poe-chat-tutorial/`).
                    """
                ).strip()
            },
            {
                "cell_type": "code",
                "source": bash_write_files(
                    step2_files,
                    ensure_dirs=[
                        "poe-chat-tutorial/app/api/chat",
                        "poe-chat-tutorial/app/components",
                        "poe-chat-tutorial/components",
                        "poe-chat-tutorial/lib",
                        "poe-chat-tutorial/tests"
                    ]
                )
            },
            {
                "cell_type": "code",
                "source": textwrap.dedent(
                    """
                    %%bash
                    set -euo pipefail
                    cd poe-chat-tutorial
                    npm install
                    """
                ).strip()
            },
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    After the install finishes, export your Poe key so development commands work:

                    ```bash
                    export POE_API_KEY=sk-your-key
                    export NEXT_PUBLIC_POE_DEFAULT_MODEL=gpt-oss-20b
                    ```

                    We keep the API key out of git by using env vars instead of hardcoding.
                    """
                ).strip()
            }
        ]
    }
)

# Step 3 files
step3_files = {
    "poe-chat-tutorial/lib/models.ts": load("lib/models.ts"),
    "poe-chat-tutorial/components/ModelSelector.tsx": load("components/ModelSelector.tsx"),
}

sections.append(
    {
        "section_number": 3,
        "title": "Step 3: Build the Poe Model Selector",
        "estimated_tokens": 480,
        "callouts": [
            {
                "type": "note",
                "message": "Guard the model list both at compile time (`PoeModelId`) and at runtime (`isAllowedModel`)."
            }
        ],
        "content": [
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    The selector drives everything downstream, so we enumerate the ten supported teachers and expose a typed helper that server components can trust. The React client component renders the dropdown and surfaces per-model descriptions to help reviewers pick the right runtime.
                    """
                ).strip()
            },
            {
                "cell_type": "code",
                "source": bash_write_files(step3_files)
            },
            {
                "cell_type": "markdown",
                "source": "Update the homepage to render the selector (chat + telemetry will arrive in the next steps):"
            },
            {
                "cell_type": "code",
                "source": bash_write_files({"poe-chat-tutorial/app/page.tsx": PAGE_STEP3})
            }
        ]
    }
)

# Step 4 files
step4_core_files = {
    "poe-chat-tutorial/lib/telemetry.ts": load("lib/telemetry.ts"),
    "poe-chat-tutorial/components/ChatWindow.tsx": load("components/ChatWindow.tsx"),
    "poe-chat-tutorial/app/api/chat/route.ts": load("app/api/chat/route.ts"),
}

sections.append(
    {
        "section_number": 4,
        "title": "Step 4: Stream Chat Responses from Poe",
        "estimated_tokens": 520,
        "callouts": [
            {
                "type": "tip",
                "message": "We stream Server-Sent Events (SSE) so readers can watch completions unfold in real time."
            }
        ],
        "content": [
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    Time to wire the backend. We expose a `/api/chat` route that validates model IDs, forwards messages to Poe using the OpenAI SDK, and streams deltas back as SSE. On the client, `ChatWindow` consumes the stream, updates the UI incrementally, and prepares telemetry records.
                    """
                ).strip()
            },
            {
                "cell_type": "code",
                "source": bash_write_files(step4_core_files)
            },
            {
                "cell_type": "markdown",
                "source": "Render the chat window and show the most recent telemetry reading so we can confirm streaming works before polishing the dashboard:"
            },
            {
                "cell_type": "code",
                "source": bash_write_files({"poe-chat-tutorial/app/page.tsx": PAGE_STEP4})
            }
        ]
    }
)

# Step 5 files
sections.append(
    {
        "section_number": 5,
        "title": "Step 5: Add Telemetry and Error Reporting",
        "estimated_tokens": 460,
        "callouts": [
            {
                "type": "note",
                "message": "Telemetry lives client-side for simplicity, but the types make it trivial to ship events elsewhere later."
            }
        ],
        "content": [
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    With streaming in place, we surface latency and token usage so QA and launch teams can compare models objectively. The telemetry panel lists each turn with a status pill and highlights failures.
                    """
                ).strip()
            },
            {
                "cell_type": "code",
                "source": bash_write_files({"poe-chat-tutorial/components/TelemetryPanel.tsx": load("components/TelemetryPanel.tsx")})
            },
            {
                "cell_type": "code",
                "source": bash_write_files({"poe-chat-tutorial/app/page.tsx": PAGE_FINAL})
            }
        ]
    }
)

# Step 6 files
step6_files = {
    "poe-chat-tutorial/tests/models.test.ts": load("tests/models.test.ts"),
    "poe-chat-tutorial/vitest.config.ts": load("vitest.config.ts"),
}

sections.append(
    {
        "section_number": 6,
        "title": "Step 6: Test and Validate the Experience",
        "estimated_tokens": 380,
        "callouts": [
            {
                "type": "tip",
                "message": "Running `npm run lint` first catches config drift before the Vitest suite runs."
            }
        ],
        "content": [
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    Ship with confidence by locking in linting + unit smoke tests. The test suite covers our model guardrails and telemetry IDs; linting keeps Next.js conventions intact.
                    """
                ).strip()
            },
            {
                "cell_type": "code",
                "source": bash_write_files(step6_files)
            },
            {
                "cell_type": "code",
                "source": textwrap.dedent(
                    """
                    %%bash
                    set -euo pipefail
                    cd poe-chat-tutorial
                    npm run lint
                    npm run test
                    """
                ).strip()
            },
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    If you have your `POE_API_KEY` exported, optionally run the dev server and send a test prompt:

                    ```bash
                    cd poe-chat-tutorial
                    npm run dev
                    ```

                    Visit http://localhost:3000 and confirm streaming + telemetry behave as expected.
                    """
                ).strip()
            }
        ]
    }
)

sections.append(
    {
        "section_number": 7,
        "title": "Step 7: Ship, Iterate, and Next Steps",
        "estimated_tokens": 300,
        "callouts": [
            {
                "type": "note",
                "message": "Bundle the notebook, QA checklist, and this brief before handing off to reviewers."
            }
        ],
        "content": [
            {
                "cell_type": "markdown",
                "source": textwrap.dedent(
                    """
                    Wrap things up by capturing QA notes:

                    - ✅ Lint + Vitest run clean.
                    - ✅ Streaming works across ten models (spot-check with real Poe key).
                    - ⚠️ TODO for production: persist telemetry to your analytics stack.

                    Package the notebook output (`File → Download .ipynb`) alongside `chat-poe-brief.md` and the QA checklist. Share it with another editor for the final review—fresh eyes often spot tone or clarity issues the author misses.

                    **Next ideas:**
                    1. Add server-side rate limiting per model before exposing publicly.
                    2. Build a compare view that renders latency deltas across models.
                    3. Pipe telemetry into a hosted dashboard (e.g., Vercel Analytics or PostHog).
                    """
                ).strip()
            }
        ]
    }
)

for section in sections:
    path = SECTIONS_DIR / f"step-{section['section_number']}.json"
    path.write_text(json.dumps(section, indent=2) + "\n")

print(f"Wrote {len(sections)} sections to {SECTIONS_DIR}")
