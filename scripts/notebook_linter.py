#!/usr/bin/env python3
"""
Notebook Linter: checks for core teaching-and-repro best practices in Jupyter notebooks.

Checks
- seeds: random/np/torch seeds set in at least one cell
- version_pins: pip install lines pin packages with == (or VCS urls)
- secrets: API keys read from env, not hardcoded (basic heuristic)
- eval_cell: at least one evaluation indicator (assert/metrics) or an Evaluation section
- cost_logging: references to token usage or cost metrics

Usage
  python scripts/notebook_linter.py path/or/glob/*.ipynb [more_paths ...]
  python scripts/notebook_linter.py alain-ai-learning-platform/docs/templates/teaching_template.ipynb

Options
  --json      emit JSON report to stdout
  --soft      do not exit non-zero on failures
  --verbose   print debug info
"""
import argparse
import json
import sys
import re
from pathlib import Path


SEED_PATTERNS = [
    re.compile(r"\brandom\.seed\s*\("),
    re.compile(r"\b(np|numpy)\.random\.seed\s*\("),
    re.compile(r"\btorch\.manual_seed\s*\("),
    re.compile(r"\btorch\.cuda\.manual_seed_all\s*\("),
]

PIP_INSTALL_RE = re.compile(r"(^|[!\s])pip(3)?\s+(-q\s+|-U\s+|-qq\s+|--quiet\s+|--upgrade\s+)*install\s+", re.IGNORECASE)

def is_pinned_pkg_token(tok: str) -> bool:
    # Consider URLs or VCS pinned
    if tok.startswith(("git+", "http://", "https://")):
        return True
    # Editable/local installs are out of scope
    if tok.startswith(("-e", "./", "../")):
        return True
    # Ignore flags
    if tok.startswith("-"):
        return True
    # Basic package token should include version pin
    return "==" in tok

def extract_pip_lines(cell_src: str):
    lines = []
    for line in cell_src.splitlines():
        if PIP_INSTALL_RE.search(line):
            lines.append(line.strip())
    return lines

def analyze_notebook(path: Path, verbose: bool = False):
    try:
        nb = json.loads(path.read_text())
    except Exception as e:
        return {"path": str(path), "error": f"failed_to_read: {e}"}

    code_cells = [c for c in nb.get("cells", []) if c.get("cell_type") == "code"]
    md_cells = [c for c in nb.get("cells", []) if c.get("cell_type") == "markdown"]

    def cell_text(c):
        return "".join(c.get("source", [])) if isinstance(c.get("source"), list) else (c.get("source") or "")

    all_code = "\n".join(cell_text(c) for c in code_cells)
    all_md = "\n".join(cell_text(c) for c in md_cells)

    # seeds
    seeds_ok = any(p.search(all_code) for p in SEED_PATTERNS)

    # version pins
    pip_lines = []
    for c in code_cells:
        src = cell_text(c)
        pip_lines.extend(extract_pip_lines(src))
    version_pins_ok = True
    unpinned = []
    for line in pip_lines:
        # tokenize roughly by whitespace
        toks = [t for t in line.split() if t not in ("pip", "pip3", "install", "python", "-q", "-qq", "--quiet", "-U", "--upgrade", "-r")]
        # ignore requirements files (-r requirements.txt)
        toks = [t for t in toks if not t.endswith("requirements.txt")]
        bad = [t for t in toks if not is_pinned_pkg_token(t)]
        if bad:
            version_pins_ok = False
            unpinned.append({"line": line, "packages": bad})

    # secrets handling
    secrets_via_env = any(
        re.search(r"getenv\(\s*['\"](OPENAI_API_KEY|ANTHROPIC_API_KEY)['\"]\s*\)", all_code)
        or re.search(r"os\.environ\.get\(\s*['\"](OPENAI_API_KEY|ANTHROPIC_API_KEY)['\"]\s*\)", all_code)
        for _ in [0]
    )
    hardcoded_key = bool(re.search(r"api_key\s*=\s*['\"](sk-[A-Za-z0-9]+|[A-Za-z0-9_\-]{20,})['\"]", all_code)) or bool(
        re.search(r"(OPENAI_API_KEY|ANTHROPIC_API_KEY)\s*=\s*['\"][^'\"]+['\"]", all_code)
    )
    secrets_ok = secrets_via_env and not hardcoded_key

    # evaluation
    eval_heading = bool(re.search(r"^\s*##\s*Evaluation", all_md, flags=re.MULTILINE))
    eval_assert = "assert " in all_code or bool(re.search(r"def\s+test_", all_code)) or "accuracy" in all_code
    eval_ok = eval_heading or eval_assert

    # cost logging
    cost_ok = any(
        s in all_code for s in [
            ".usage", "total_tokens", "prompt_tokens", "completion_tokens", "input_tokens", "output_tokens", "Tokens total"
        ]
    ) or ("usage" in all_code and "tokens" in all_code)

    result = {
        "path": str(path),
        "checks": {
            "seeds": seeds_ok,
            "version_pins": version_pins_ok,
            "secrets": secrets_ok,
            "evaluation": eval_ok,
            "cost_logging": cost_ok,
        },
    }
    if not version_pins_ok:
        result["unpinned_examples"] = unpinned
    if verbose:
        result["pip_lines"] = pip_lines

    return result


def iter_notebooks(paths):
    for p in paths:
        p = Path(p)
        if p.is_dir():
            yield from p.rglob("*.ipynb")
        else:
            # Support globs
            if any(ch in p.name for ch in ["*", "?", "["]):
                yield from Path(p.parent if p.parent != Path("") else ".").glob(p.name)
            else:
                if p.exists():
                    yield p


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+", help="notebook files, dirs, or globs")
    ap.add_argument("--json", action="store_true", dest="as_json")
    ap.add_argument("--soft", action="store_true", help="do not exit non-zero on failures")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    reports = []
    for nb_path in iter_notebooks(args.paths):
        rep = analyze_notebook(nb_path, verbose=args.verbose)
        reports.append(rep)

    if args.as_json:
        print(json.dumps({"reports": reports}, indent=2))
    else:
        failures = 0
        for r in reports:
            if "error" in r:
                print(f"[ERROR] {r['path']}: {r['error']}")
                failures += 1
                continue
            ck = r["checks"]
            status = "PASS" if all(ck.values()) else "FAIL"
            print(f"\n{status}: {r['path']}")
            for name, ok in ck.items():
                print(f"  - {name:14}: {'ok' if ok else 'MISSING'}")
            if r.get("unpinned_examples"):
                for u in r["unpinned_examples"]:
                    print(f"    unpinned -> {u['line']}")

        total = len(reports)
        print(f"\nSummary: {total} notebook(s) scanned.")
        if any("error" in r or not all(r.get("checks", {}).values()) for r in reports):
            print("Some checks failed.")
            if not args.soft:
                sys.exit(2)

if __name__ == "__main__":
    main()

