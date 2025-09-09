#!/usr/bin/env python3
"""
Notebook Review & Inventory

Scans notebooks and computes heuristic scores for:
- clarity: markdown presence, headings, structure
- effectiveness: evaluation/asserts, task framing
- engagement: exercises, questions, images
- style_layout: headings, cell length sanity, sectioning
- reproducibility: seeds, version pins, env prints
- observability: token usage/cost logging, latency timing

Outputs:
- JSON report with per-notebook scores
- Optional Markdown summary (top items, aggregates)

Usage:
  python scripts/notebook_review.py --root . \
    --json alain-ai-learning-platform/docs/notebooks/notebook-inventory.json \
    --md   alain-ai-learning-platform/docs/notebooks/notebook-inventory.md
"""
import argparse
import json
import re
from pathlib import Path
from collections import defaultdict


HEAD_RE = re.compile(r"^\s*#\s+|^\s*##\s+|^\s*###\s+", re.MULTILINE)

def read_nb(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        return {"__error__": str(e)}


def text_of(cell):
    src = cell.get("source", [])
    if isinstance(src, list):
        return "".join(src)
    return src or ""


def score_notebook(nb_json):
    if "__error__" in nb_json:
        return {"error": nb_json["__error__"]}

    cells = nb_json.get("cells", [])
    md_cells = [c for c in cells if c.get("cell_type") == "markdown"]
    code_cells = [c for c in cells if c.get("cell_type") == "code"]

    md_text = "\n".join(text_of(c) for c in md_cells)
    code_text = "\n".join(text_of(c) for c in code_cells)

    # Heuristics
    has_title = any(text_of(c).lstrip().startswith("# ") for c in md_cells[:3])
    headings_count = len(HEAD_RE.findall(md_text))
    md_ratio = (len(md_cells) / max(1, len(cells)))
    short_cells = sum(1 for c in code_cells if len(text_of(c).splitlines()) <= 35)
    short_ratio = short_cells / max(1, len(code_cells))

    clarity = 0
    clarity += 2 if has_title else 0
    clarity += 2 if headings_count >= 4 else (1 if headings_count >= 2 else 0)
    clarity += 1 if md_ratio >= 0.2 else 0
    clarity = min(5, clarity)

    has_eval_heading = bool(re.search(r"^\s*##\s*Evaluation", md_text, re.MULTILINE))
    has_asserts = ("assert " in code_text) or bool(re.search(r"accuracy|metrics|evaluate", code_text, re.I))
    task_framing = bool(re.search(r"##\s*(Quickstart|Setup|Guided|Steps|Overview)", md_text))
    effectiveness = 0
    effectiveness += 2 if has_eval_heading else 0
    effectiveness += 2 if has_asserts else 0
    effectiveness += 1 if task_framing else 0
    effectiveness = min(5, effectiveness)

    has_exercises = bool(re.search(r"##\s*Exercises|Try this|Challenge", md_text, re.I))
    has_questions = bool(re.search(r"\?\s*$", md_text, re.M))
    has_image = ("![](" in md_text) or bool(re.search(r"<img\s", md_text))
    engagement = 0
    engagement += 2 if has_exercises else 0
    engagement += 1 if has_questions else 0
    engagement += 1 if has_image else 0
    engagement = min(5, engagement)

    has_sections = headings_count >= 4
    sane_cell_lengths = short_ratio >= 0.6  # majority of code cells short
    has_setup_section = bool(re.search(r"##\s*Setup", md_text))
    style_layout = 0
    style_layout += 2 if has_sections else 0
    style_layout += 2 if sane_cell_lengths else 0
    style_layout += 1 if has_setup_section else 0
    style_layout = min(5, style_layout)

    seeds = any(re.search(p, code_text) for p in [r"random\.seed\(", r"np\.random\.seed\(", r"numpy\.random\.seed\(", r"torch\.manual_seed\("])
    pip_pins = bool(re.search(r"pip\s+install\s+[^\n]*==", code_text)) or "-r requirements.txt" in code_text
    prints_env = bool(re.search(r"pip show|pip list|sys\.version|platform\.platform|torch\.cuda|cuda", code_text))
    reproducibility = 0
    reproducibility += 2 if seeds else 0
    reproducibility += 2 if pip_pins else 0
    reproducibility += 1 if prints_env else 0
    reproducibility = min(5, reproducibility)

    cost_tokens = any(s in code_text for s in ["usage", "total_tokens", "prompt_tokens", "completion_tokens", "input_tokens", "output_tokens"])
    latency = bool(re.search(r"time\.(time|perf_counter)|%%time", code_text))
    observability = 0
    observability += 3 if cost_tokens else 0
    observability += 1 if latency else 0
    observability = min(5, observability)

    return {
        "clarity": clarity,
        "effectiveness": effectiveness,
        "engagement": engagement,
        "style_layout": style_layout,
        "reproducibility": reproducibility,
        "observability": observability,
        "details": {
            "has_title": has_title,
            "headings_count": headings_count,
            "md_ratio": round(md_ratio, 2),
            "short_code_ratio": round(short_ratio, 2),
            "has_eval_heading": has_eval_heading,
            "has_asserts_or_metrics": bool(has_asserts),
            "has_exercises": has_exercises,
            "has_image": has_image,
            "seeds": seeds,
            "pip_pins": pip_pins,
            "prints_env": prints_env,
            "cost_tokens": cost_tokens,
            "latency": latency,
        },
        "totals": {
            "cells": len(cells),
            "markdown": len(md_cells),
            "code": len(code_cells),
        }
    }


def classify_source(path: Path) -> str:
    p = str(path)
    if "openai-cookbook" in p:
        return "openai"
    if "anthropic-notebooks" in p:
        return "anthropic"
    if "huggingface" in p or "Hands-On-Large-Language-Models" in p:
        return "hf/unsloth"
    return "other"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--json", dest="json_out", help="write JSON report here")
    ap.add_argument("--md", dest="md_out", help="write Markdown summary here")
    args = ap.parse_args()

    root = Path(args.root)
    nbs = list(root.rglob("*.ipynb"))

    results = []
    for nbp in nbs:
        nbj = read_nb(nbp)
        score = score_notebook(nbj)
        result = {
            "path": str(nbp),
            "source": classify_source(nbp),
            **score,
        }
        results.append(result)

    # Aggregates
    agg = defaultdict(lambda: defaultdict(list))
    for r in results:
        src = r.get("source", "other")
        for k in ["clarity", "effectiveness", "engagement", "style_layout", "reproducibility", "observability"]:
            v = r.get(k)
            if isinstance(v, int):
                agg[src][k].append(v)

    def avg(lst):
        return round(sum(lst)/len(lst), 2) if lst else 0

    aggregates = {
        src: {k: avg(vs) for k, vs in metrics.items()} for src, metrics in agg.items()
    }

    payload = {
        "total": len(results),
        "aggregates": aggregates,
        "results": results,
    }

    if args.json_out:
        Path(args.json_out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.json_out).write_text(json.dumps(payload, indent=2))

    if args.md_out:
        lines = []
        lines.append("# Notebook Inventory & Scores")
        lines.append("")
        lines.append(f"Total notebooks: {len(results)}")
        lines.append("")
        lines.append("## Averages by Source")
        for src, metrics in aggregates.items():
            lines.append(f"- {src}: " + ", ".join(f"{k} {v}/5" for k, v in metrics.items()))
        lines.append("")
        lines.append("## Top 15 by Overall Score")
        def overall(r):
            return sum(r.get(k, 0) for k in ["clarity","effectiveness","engagement","style_layout","reproducibility","observability"])
        top = sorted(results, key=overall, reverse=True)[:15]
        for r in top:
            lines.append(f"- {r['path']}: total {overall(r)}/30 "
                         f"(C{r['clarity']}, E{r['effectiveness']}, G{r['engagement']}, S{r['style_layout']}, R{r['reproducibility']}, O{r['observability']})")
        lines.append("")
        lines.append("Note: Heuristic scoring — intended for triage and curation, not definitive quality judgments.")

        md = "\n".join(lines)
        Path(args.md_out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.md_out).write_text(md)

    else:
        print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
