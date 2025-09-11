#!/usr/bin/env python3
"""
notebook_smoke.py

Execute a minimal subset of a Jupyter notebook to validate environment &
basic functionality. Intended for CI smoke checks and local quick tests.

Behavior:
- If there are cells tagged 'smoke', execute only those (in order).
- Otherwise, execute the first N code cells (default: 1).
- If required environment (e.g., OPENAI_API_KEY) is missing and --allow-missing-keys
  is set, write a 'skipped' report and exit 0.

Output:
- Writes a JSON report with status: 'passed' | 'failed' | 'skipped',
  plus any error summaries and executed cell indices.

Usage:
  python scripts/notebook_smoke.py --in notebooks/lesson.ipynb --out reports/lesson.validation.json \
    [--first-n 1] [--timeout 60] [--allow-missing-keys]
"""
from __future__ import annotations

import argparse
import json
import os
from typing import Any, Dict, List

import nbformat
from nbclient import NotebookClient
from nbclient.exceptions import CellExecutionError


def has_required_keys() -> bool:
    # Minimal heuristic: if a smoke cell attempts API calls, it usually needs a key.
    # We check for common env vars; extend if needed.
    return bool(os.getenv("OPENAI_API_KEY") or os.getenv("POE_API_KEY"))


def select_smoke_cells(nb: nbformat.NotebookNode, first_n: int) -> List[int]:
    indices: List[int] = []
    for i, cell in enumerate(nb.cells):
        if cell.get("cell_type") != "code":
            continue
        tags = cell.get("metadata", {}).get("tags", []) or []
        if any(t == "smoke" for t in tags):
            indices.append(i)
    if indices:
        return indices
    # Fallback: first N code cells
    for i, cell in enumerate(nb.cells):
        if cell.get("cell_type") == "code":
            indices.append(i)
            if len(indices) >= first_n:
                break
    return indices


def run_cells(nb_path: str, indices: List[int], timeout: int) -> Dict[str, Any]:
    nb = nbformat.read(nb_path, as_version=4)
    client = NotebookClient(nb, timeout=timeout, kernel_name=(nb.get("metadata", {}).get("kernelspec", {}).get("name") or "python3"))
    executed: List[int] = []
    errors: List[Dict[str, Any]] = []

    # Execute only the selected cells in-order to reduce runtime/cost.
    # Use client.execute with preprocessor hooks by temporarily setting tags and filtering.
    # Simpler approach: execute step-by-step.
    for i in indices:
        cell = nb.cells[i]
        try:
            client.execute_cell(cell, i, execution_count=None)
            executed.append(i)
        except CellExecutionError as e:
            executed.append(i)
            # Extract rich error info from the cell outputs if present
            ename = getattr(e, 'ename', None) or 'ExecutionError'
            evalue = getattr(e, 'evalue', None) or str(e)
            tb = getattr(e, 'traceback', None)
            if not tb and cell.get('outputs'):
                for out in cell['outputs']:
                    if out.get('output_type') == 'error':
                        ename = out.get('ename') or ename
                        evalue = out.get('evalue') or evalue
                        tb = out.get('traceback') or tb
            errors.append({
                "cell_index": i,
                "ename": ename,
                "evalue": evalue,
                "traceback": tb,
            })
            break  # stop on first failure

    status = "passed" if not errors else "failed"
    return {"status": status, "executed_cells": executed, "errors": errors}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="in_path", required=True, help="Notebook path (.ipynb)")
    ap.add_argument("--out", dest="out_path", required=True, help="Output report path (.json)")
    ap.add_argument("--first-n", dest="first_n", type=int, default=1, help="Fallback number of code cells to run if no smoke tags")
    ap.add_argument("--timeout", dest="timeout", type=int, default=60, help="Per-cell execution timeout (seconds)")
    ap.add_argument("--allow-missing-keys", dest="allow_missing", action="store_true", help="Skip execution if OPENAI_API_KEY/POE_API_KEY absent")
    args = ap.parse_args()

    os.makedirs(os.path.dirname(args.out_path) or ".", exist_ok=True)

    nb = nbformat.read(args.in_path, as_version=4)

    # Pre-flight: skip if missing keys and allowed
    if args.allow_missing and not has_required_keys():
        report = {
            "status": "skipped",
            "reason": "Missing OPENAI_API_KEY/POE_API_KEY",
            "executed_cells": [],
            "errors": [],
        }
        with open(args.out_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
        print(f"✓ Skipped (missing keys). Wrote {args.out_path}")
        return

    indices = select_smoke_cells(nb, first_n=args.first_n)
    result = run_cells(args.in_path, indices, timeout=args.timeout)
    with open(args.out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(f"✓ {result['status'].upper()}: Wrote {args.out_path}")


if __name__ == "__main__":
    main()

