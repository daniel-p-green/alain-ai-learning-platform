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
    def clamp_pct(value: float) -> int:
        return max(0, min(100, int(round(value))))

    has_title = any(text_of(c).lstrip().startswith("# ") for c in md_cells[:3])
    headings_count = len(HEAD_RE.findall(md_text))
    md_ratio = (len(md_cells) / max(1, len(cells)))
    short_cells = sum(1 for c in code_cells if len(text_of(c).splitlines()) <= 35)
    short_ratio = short_cells / max(1, len(code_cells)) if code_cells else 0

    heading_frac = min(headings_count / 8, 1.0)
    markdown_balance = min(md_ratio / 0.5, 1.0)
    clarity = clamp_pct((0.3 * (1 if has_title else 0) + 0.4 * heading_frac + 0.3 * markdown_balance) * 100)

    has_eval_heading = bool(re.search(r"^\s*##\s*Evaluation", md_text, re.MULTILINE))
    assert_count = len(re.findall(r"\bassert\b", code_text))
    metrics_hits = len(re.findall(r"accuracy|metric|evaluate", code_text, re.I))
    assert_signal = min((assert_count + metrics_hits) / 6, 1.0)
    task_framing = bool(re.search(r"##\s*(Quickstart|Setup|Guided|Steps|Overview)", md_text))
    effectiveness = clamp_pct((0.35 * (1 if has_eval_heading else 0) + 0.45 * assert_signal + 0.2 * (1 if task_framing else 0)) * 100)

    has_exercises = bool(re.search(r"##\s*(Exercises|Try\s+This|Challenge)", md_text, re.I))
    question_count = len(re.findall(r"\?\s*$", md_text, re.M))
    image_count = len(re.findall(r"!\[[^\]]*\]\([^)]+\)|<img\s", md_text))
    exercise_score = 1 if has_exercises else 0
    question_score = min(question_count / 6, 1.0)
    image_score = min(image_count / 3, 1.0)
    engagement = clamp_pct((0.4 * exercise_score + 0.35 * question_score + 0.25 * image_score) * 100)

    section_score = min(headings_count / 8, 1.0)
    sane_cell_lengths = min(max(short_ratio, 0.0), 1.0)
    has_setup_section = bool(re.search(r"##\s*Setup", md_text))
    style_layout = clamp_pct((0.4 * section_score + 0.35 * sane_cell_lengths + 0.25 * (1 if has_setup_section else 0)) * 100)

    seed_patterns = [r"random\.seed\(", r"np\.random\.seed\(", r"numpy\.random\.seed\(", r"torch\.manual_seed\("]
    seed_count = sum(len(re.findall(p, code_text)) for p in seed_patterns)
    pip_pin_count = len(re.findall(r"pip\s+install\s+[^\n]*==", code_text)) + (1 if "-r requirements.txt" in code_text else 0)
    env_hits = len(re.findall(r"pip\s+(show|list)|sys\.version|platform\.platform|torch\.cuda|cuda", code_text))
    seed_score = min(seed_count / 3, 1.0)
    pip_score = min(pip_pin_count / 3, 1.0)
    env_score = min(env_hits / 3, 1.0)
    reproducibility = clamp_pct((0.4 * seed_score + 0.4 * pip_score + 0.2 * env_score) * 100)

    token_mentions = len(re.findall(r"(prompt|completion|total|input|output)_tokens", code_text, re.I)) + len(re.findall(r"usage", code_text, re.I))
    latency_mentions = len(re.findall(r"time\.(time|perf_counter)|%%time", code_text))
    tokens_score = min(token_mentions / 4, 1.0)
    latency_score = min(latency_mentions / 3, 1.0)
    observability = clamp_pct((0.7 * tokens_score + 0.3 * latency_score) * 100)

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
            "assert_count": assert_count,
            "metrics_hits": metrics_hits,
            "has_exercises": has_exercises,
            "question_count": question_count,
            "image_count": image_count,
            "seed_matches": seed_count,
            "pip_pin_matches": pip_pin_count,
            "env_introspection_hits": env_hits,
            "token_mentions": token_mentions,
            "latency_mentions": latency_mentions,
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
            if isinstance(v, (int, float)):
                agg[src][k].append(v)

    def avg(lst):
        return round(sum(lst)/len(lst), 1) if lst else 0.0

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
            lines.append(f"- {src}: " + ", ".join(f"{k} {float(v):.1f}/100" for k, v in metrics.items()))
        lines.append("")
        lines.append("## Top 15 by Overall Score")
        metric_keys = ["clarity","effectiveness","engagement","style_layout","reproducibility","observability"]
        def overall(r):
            vals = [r.get(k, 0) for k in metric_keys if isinstance(r.get(k), (int, float))]
            return round(sum(vals)/len(vals), 1) if vals else 0
        top = sorted(results, key=overall, reverse=True)[:15]
        for r in top:
            lines.append(f"- {r['path']}: avg {overall(r)}/100 "
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
