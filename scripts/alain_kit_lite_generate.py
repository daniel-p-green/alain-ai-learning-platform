#!/usr/bin/env python3
"""
ALAIN‑Kit Lite generator

Create a compact lesson JSON and render a runnable .ipynb using the
existing scripts/json_to_notebook.py. Keeps token usage low by using
templated sections tailored by level and provider.

Usage examples:

  python scripts/alain_kit_lite_generate.py \
    --hf-model openai/gpt-oss-20b \
    --brief "Minimal streaming chat example" \
    --level beginner \
    --provider poe

  python scripts/alain_kit_lite_generate.py \
    --hf-model meta-llama/Llama-3.1-8B-Instruct \
    --brief "Compare temperature 0.2 vs 0.9" \
    --level advanced \
    --provider local \
    --base-url http://localhost:1234/v1 \
    --chat-model meta-llama/Llama-3.1-8B-Instruct
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "notebook_output"
BUILDER = ROOT / "scripts" / "json_to_notebook.py"


def slugify(s: str) -> str:
    return re.sub(r"[^a-zA-Z0-9]+", "-", s.strip().lower()).strip("-")[:60]


def level_steps(level: str, brief: str, chat_model: str) -> list[dict]:
    # Short, token‑light content and templates per level
    if level == "beginner":
        return [
            {
                "title": "Environment & Client Setup",
                "content": (
                    "Configure OpenAI‑compatible client with provider defaults.\n\n"
                    "Tip: Keep secrets in .env.local (POE_API_KEY or OPENAI_API_KEY)."
                ),
                "code_template": "Print the configured OPENAI_BASE_URL and run a 1‑line hello to verify."
            },
            {
                "title": "First Chat Completion",
                "content": "Send your brief to the model and print the reply.",
                "code_template": brief
            },
            {
                "title": "Adjust Parameters",
                "content": "Experiment with temperature and max_tokens.",
                "model_params": {"temperature": 0.7},
                "code_template": f"Respond to the same topic but more concise. Model: {chat_model}"
            },
        ]
    if level == "intermediate":
        return [
            {
                "title": "Streaming Basics",
                "content": (
                    "Use streaming to improve perceived latency. Parse chunks safely."
                ),
                "code_template": "Explain streaming vs. non‑streaming and when to use each."
            },
            {
                "title": "Streaming Demo",
                "content": "Stream the model’s response for the brief.",
                "model_params": {"temperature": 0.5},
                "code_template": brief
            },
            {
                "title": "Telemetry",
                "content": "Capture latency and token usage from the response.",
                "model_params": {"temperature": 0.7},
                "code_template": "Summarize key points in 4 bullets and keep under 120 tokens."
            },
        ]
    # advanced
    return [
        {
            "title": "Provider Swap & Guardrails",
            "content": (
                "Note the base URL and key expectations for Poe vs. gateways."
            ),
            "code_template": "Print which provider is active and any detected model name."
        },
        {
            "title": "Pairwise Compare",
            "content": "Call the same prompt on two models and print side‑by‑side outputs.",
            "model_params": {"temperature": 0.3},
            "code_template": brief
        },
        {
            "title": "Mini Elo Update",
            "content": "Apply a single Elo update assuming model A won. Show new ratings.",
            "model_params": {"temperature": 0.7},
            "code_template": (
                "Given ratings rA=1500, rB=1500 and outcome A=win, compute new Elo with K=24."
            )
        },
    ]


def make_lesson(provider: str, chat_model: str, hf_model: str, brief: str, level: str) -> dict:
    title = f"Lite Notebook · {hf_model} · {level.capitalize()}"
    description = (
        "Token‑light tutorial: environment setup + runnable calls."
        " Uses OpenAI SDK against selected provider (Poe/OpenAI‑compatible/local)."
    )
    objectives = [
        "Configure provider and API key correctly",
        "Run a model call with safe defaults",
        "Tune basic parameters and/or streaming",
        "Record simple telemetry or ranking step"
    ]
    steps = []
    for i, s in enumerate(level_steps(level, brief, chat_model), start=1):
        step = {
            "step_order": i,
            "title": s["title"],
            "content": s.get("content", ""),
            "code_template": s.get("code_template", ""),
        }
        if "model_params" in s:
            step["model_params"] = s["model_params"]
        steps.append(step)

    return {
        "title": title,
        "description": description,
        "provider": provider,
        "model": chat_model,
        "learning_objectives": objectives,
        "steps": steps,
        "assessments": [
            {
                "question": "Which env var provides the Poe key?",
                "options": ["OPENAI_BASE_URL", "POE_API_KEY", "NEXT_RUNTIME", "HF_TOKEN"],
                "correct_index": 1,
                "explanation": "Poe auth uses POE_API_KEY; the code maps it to OPENAI_API_KEY at runtime."
            }
        ]
    }


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--hf-model", required=True, help="Hugging Face model id (owner/model)")
    ap.add_argument("--brief", required=True, help="Short instruction to drive examples")
    ap.add_argument("--level", choices=["beginner", "intermediate", "advanced"], default="beginner")
    ap.add_argument("--provider", choices=["poe", "openai-compatible", "local"], default="poe")
    ap.add_argument("--base-url", default="", help="Override base URL for openai-compatible/local")
    ap.add_argument("--chat-model", default="", help="Override chat model id used in code")
    ap.add_argument("--out-dir", default=str(OUT_DIR), help="Output directory for files")
    args = ap.parse_args()

    # Decide model and provider specifics
    provider = args.provider if args.provider != "local" else "openai-compatible"
    if args.chat_model:
        chat_model = args.chat_model
    else:
        if provider == "poe":
            chat_model = "gpt-oss-20b"
        else:
            # For gateways/local, default to the HF id (works for LM Studio/vLLM if loaded)
            chat_model = args.hf_model

    # Build lesson
    lesson = make_lesson(provider, chat_model, args.hf_model, args.brief, args.level)

    # Paths
    ts = int(time.time())
    slug = slugify(f"{args.hf_model}-{args.level}")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    json_path = out_dir / f"lite_{slug}_{ts}.json"
    ipynb_path = out_dir / f"lite_{slug}_{ts}.ipynb"

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(lesson, f, indent=2)

    # Render notebook using existing builder
    cmd = [
        "python",
        str(BUILDER),
        "--in",
        str(json_path),
        "--out",
        str(ipynb_path),
    ]
    subprocess.check_call(cmd, cwd=ROOT)

    # Print next‑step guidance
    print("✓ ALAIN‑Kit Lite lesson JSON:", json_path)
    print("✓ Notebook:", ipynb_path)
    print("Run it with your env configured. For Poe, set POE_API_KEY; the notebook maps it to OPENAI_API_KEY.")
    if args.base_url:
        print("Note: set OPENAI_BASE_URL=", args.base_url)


if __name__ == "__main__":
    main()

