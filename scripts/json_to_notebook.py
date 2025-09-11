#!/usr/bin/env python3
"""
json_to_notebook.py

Convert a validated ALAIN lesson JSON into a Jupyter notebook (.ipynb).

Skeleton renderer using nbformat. Designed to be simple, deterministic,
and compatible with future smoke test execution (via nbclient).

Usage:
  python scripts/json_to_notebook.py --in lesson.json --out lesson.ipynb

Notes:
- Expects fields defined in schemas/alain-lesson.schema.json.
- If provider/model are missing, applies safe defaults (poe/gpt-oss-20b).
- If assessments lack step_order, renders them after all steps.
"""

import json
import argparse
from typing import Any, Dict, List

import nbformat as nbf


DEFAULT_PROVIDER = "poe"  # or "openai-compatible"
DEFAULT_MODEL = "gpt-oss-20b"


def md(text: str) -> Any:
    nb = nbf.v4.new_markdown_cell(text)
    return nb


def code(src: str, tags: List[str] | None = None) -> Any:
    c = nbf.v4.new_code_cell(src)
    if tags:
        c.metadata.setdefault("tags", []).extend(tags)
    return c


def coerce_str(x: Any, default: str = "") -> str:
    return x if isinstance(x, str) else default


def build_notebook(lesson: Dict[str, Any]) -> nbf.NotebookNode:
    title = coerce_str(lesson.get("title"), "ALAIN Lesson")
    description = coerce_str(lesson.get("description"), "")
    provider = coerce_str(lesson.get("provider"), DEFAULT_PROVIDER)
    model = coerce_str(lesson.get("model"), DEFAULT_MODEL)
    learning_objectives = lesson.get("learning_objectives") or []
    steps: List[Dict[str, Any]] = lesson.get("steps") or []
    assessments: List[Dict[str, Any]] = lesson.get("assessments") or []

    # Intro
    intro_lines = [
        f"# {title}\n",
        "\n",
        f"{description}\n",
        "\n",
        f"> Provider: `{provider}`  •  Model: `{model}`\n",
    ]
    if learning_objectives and isinstance(learning_objectives, list):
        intro_lines += ["\n", "## Learning Objectives\n"]
        for o in learning_objectives[:8]:
            if isinstance(o, str) and o.strip():
                intro_lines.append(f"- {o}\n")

    cells: List[Any] = [md("".join(intro_lines))]

    # Optional: installs (commented to avoid surprises)
    cells.append(code("""
# Optional installs (uncomment on Colab/fresh envs)
# !pip -q install openai>=1.34.0 ipywidgets>=8.0.0
""".strip() + "\n"))

    # Provider/env config
    provider_base = "https://api.poe.com/v1" if provider == "poe" else "YOUR_OPENAI_BASE_URL"
    cells.append(code(f"""
# Configure OpenAI-compatible client
import os
from getpass import getpass

PROVIDER = {provider!r}  # 'poe' or 'openai-compatible'
os.environ.setdefault('OPENAI_BASE_URL', {provider_base!r})
# Set your API key. For Poe, set POE_API_KEY or paste below.
os.environ.setdefault('OPENAI_API_KEY', os.getenv('POE_API_KEY') or os.getenv('OPENAI_API_KEY') or '')
if not os.environ.get('OPENAI_API_KEY'):
    os.environ['OPENAI_API_KEY'] = getpass('Enter API key (input hidden): ')
""".strip() + "\n"))

    # Smoke test (tagged for selective execution)
    cells.append(code(f"""
# Quick smoke test
from openai import OpenAI
import os
base = os.environ.get('OPENAI_BASE_URL')
key = os.environ.get('OPENAI_API_KEY')
assert base and key, 'Please set OPENAI_BASE_URL and OPENAI_API_KEY env vars'
client = OpenAI(base_url=base, api_key=key)
resp = client.chat.completions.create(model={model!r}, messages=[{{"role":"user","content":"Hello from ALAIN"}}], max_tokens=32)
print(resp.choices[0].message.content)
""".strip() + "\n", tags=["smoke"]))

    # Build a quick index of assessments that include step_order
    by_step: Dict[int, List[Dict[str, Any]]] = {}
    trailing_assessments: List[Dict[str, Any]] = []
    for a in assessments:
        so = a.get("step_order")
        if isinstance(so, int):
            by_step.setdefault(so, []).append(a)
        else:
            trailing_assessments.append(a)

    # Lesson steps
    for idx, s in enumerate(steps, start=1):
        step_order = s.get("step_order") if isinstance(s.get("step_order"), int) else idx
        step_title = coerce_str(s.get("title"), f"Step {step_order}")
        step_content = coerce_str(s.get("content"), "")
        code_tmpl = s.get("code_template") if isinstance(s.get("code_template"), str) else ""
        temperature = None
        try:
            temperature = s.get("model_params", {}).get("temperature")  # type: ignore[assignment]
        except Exception:
            temperature = None
        if temperature is None:
            temperature = 0.7

        # Markdown intro for the step
        cells.append(md(f"## Step {step_order}: {step_title}\n\n{step_content}\n"))

        # Execution scaffold: reuse configured client
        safe_prompt = (code_tmpl or "").replace("'''", "\\'\\'\\'")
        cells.append(code(f"""
# Run the step prompt using the configured provider
PROMPT = '''{safe_prompt}'''
from openai import OpenAI
import os
client = OpenAI(base_url=os.environ['OPENAI_BASE_URL'], api_key=os.environ['OPENAI_API_KEY'])
resp = client.chat.completions.create(model={model!r}, messages=[{{"role":"user","content":PROMPT}}], temperature={temperature}, max_tokens=400)
print(resp.choices[0].message.content)
""".strip() + "\n"))

        # Assessments tied to this step (if any)
        for a in by_step.get(step_order, []):
            q = coerce_str(a.get("question"), "")
            opts = a.get("options") or []
            ci = a.get("correct_index", 0)
            exp = a.get("explanation")
            # Simple MCQ cell
            src = [
                "# Assessment\n",
                f"question = {json.dumps(q)}\n",
                f"options = {json.dumps(opts)}\n",
                f"correct_index = {int(ci)}\n",
                "print('Q:', question)\n",
                "for i, o in enumerate(options):\n    print(f'{i}. {o}')\n",
                "choice = 0  # <- change this to your answer index\n",
                "print('Correct!' if choice == correct_index else 'Incorrect')\n",
            ]
            if isinstance(exp, str) and exp.strip():
                src.append(f"print('Explanation:', {json.dumps(exp)})\n")
            cells.append(code("".join(src)))

            # Widget version (optional)
            cells.append(code("""
# Interactive quiz (ipywidgets)
import ipywidgets as widgets
from IPython.display import display, Markdown
q = question
opts = options
correct = correct_index
rb = widgets.RadioButtons(options=[(o, i) for i, o in enumerate(opts)], description='', disabled=False)
btn = widgets.Button(description='Submit Answer')
out = widgets.Output()
def on_click(b):
    with out:
        out.clear_output()
        sel = rb.value if hasattr(rb, 'value') else 0
        if sel == correct:
            display(Markdown('**Correct!**'))
        else:
            display(Markdown('Incorrect, please try again.'))
btn.on_click(on_click)
display(Markdown(f"### {q}"))
display(rb, btn, out)
""".strip() + "\n"))

    # Any trailing assessments without step_order go at the end
    if trailing_assessments:
        cells.append(md("## Assessments\n"))
        for a in trailing_assessments:
            q = coerce_str(a.get("question"), "")
            opts = a.get("options") or []
            ci = a.get("correct_index", 0)
            exp = a.get("explanation")
            src = [
                "# Assessment\n",
                f"question = {json.dumps(q)}\n",
                f"options = {json.dumps(opts)}\n",
                f"correct_index = {int(ci)}\n",
                "print('Q:', question)\n",
                "for i, o in enumerate(options):\n    print(f'{i}. {o}')\n",
                "choice = 0  # <- change this to your answer index\n",
                "print('Correct!' if choice == correct_index else 'Incorrect')\n",
            ]
            if isinstance(exp, str) and exp.strip():
                src.append(f"print('Explanation:', {json.dumps(exp)})\n")
            cells.append(code("".join(src)))

    nb = nbf.v4.new_notebook()
    nb["cells"] = cells
    nb["metadata"] = {
        "kernelspec": {"name": "python3", "language": "python", "display_name": "Python 3"},
        "language_info": {"name": "python"},
    }
    return nb


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--in", dest="in_path", required=True, help="Path to lesson.json")
    ap.add_argument("--out", dest="out_path", required=True, help="Path to write .ipynb")
    args = ap.parse_args()

    with open(args.in_path, "r", encoding="utf-8") as f:
        lesson = json.load(f)

    nb = build_notebook(lesson)

    with open(args.out_path, "w", encoding="utf-8") as f:
        nbf.write(nb, f)

    print(f"✓ Wrote notebook to {args.out_path}")


if __name__ == "__main__":
    main()

