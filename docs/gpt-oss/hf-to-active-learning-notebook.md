# From Hugging Face Link to Active‑Learning Notebook (GPT‑OSS Design)

Purpose: Turn any Hugging Face model link into a top‑scoring, highly engaging, and reproducible teaching notebook that runs locally with GPT‑OSS (OpenAI‑compatible) when appropriate. This codifies patterns observed across 529 curated notebooks plus our internal standards.

## Success Criteria (Hit 5/5 on Our Rubric)
- Clarity: strong title, outcomes, section headings, concise cells.
- Effectiveness: quickstart + Evaluation section with asserts/metrics.
- Engagement: at least 2 exercises and 1+ MCQ after core steps.
- Style/Layout: one idea per cell, clear sections, tidy outputs.
- Reproducibility: seeds set, pinned installs, env/GPU printed.
- Observability: token usage (if available) and latency logging.

## Step‑By‑Step Blueprint

1) Classify the HF link and choose runtime
- Parse `<org>/<model>` from `https://huggingface.co/<org>/<name>`.
- If model is Transformers‑friendly (AutoModel, Vision, ASR, etc.): use `transformers`/`datasets` with local CPU/GPU.
- If model is chat/instruction and you want fast local chat UX: use GPT‑OSS via OpenAI‑compatible API (Ollama or vLLM). See `docs/gpt-oss/local-run.md`.

2) Start from the teaching template
- Copy `docs/templates/teaching_template.ipynb` and rename.
- Keep the scaffold: Outcomes → Setup → Secrets → Quickstart → Guided Steps → Evaluation → Cost/Observability → Troubleshooting → Exercises → Cleanup.

3) Setup cell (repro foundation)
- Print Python, package versions, CUDA status.
- Set seeds for `random`, `numpy`, and `torch` when used.
- Pin critical installs with `==` (document tested versions).

4) Secrets & configuration (safe by default)
- Read API keys from env: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` (if relevant).
- For GPT‑OSS local runs: 
  - `OPENAI_BASE_URL=http://localhost:11434/v1` (Ollama) or your vLLM server.
  - `OPENAI_API_KEY=ollama` (placeholder value).

5) Quickstart (smallest working example in < 1 minute)
- Transformers: load the model/tokenizer or pipeline and run 1 inference.
- GPT‑OSS: single chat completion with temperature=0 (deterministic for checks).
- Print a short output and any available usage/tokens.

6) Guided steps (progressive learning)
- Step 1: capabilities and parameters for the model family (e.g., max length, dtype, device, chat params).
- Step 2: task‑specific prompt or preprocessing; show 1–2 variants.
- Step 3: introduce a tool/format (JSON output, Pydantic schema) or dataset batch.
- Step 4: batch/streaming, caching, or a small RAG/fine‑tune example where applicable.

7) Evaluation (make success visible)
- Add a tiny golden set (10–20 items) or a simple acceptance test.
- Use deterministic settings (temperature ~0). Compute accuracy or exact‑match.
- Print a compact metric summary and a couple of failures.

8) Observability (tokens + latency)
- If SDK provides usage, print prompt/input/output tokens and totals.
- Time key calls; report mean latency over 5–10 runs.
- If tokens not exposed locally, mention limitation and (optionally) estimate via a tokenizer.

9) Engagement (MCQs + exercises)
- Add at least one MCQ cell per major section; include feedback and explanation.
- Provide 2–4 “Try this” exercises: modify prompts, add a tool, change a parameter, or expand the golden set.

10) Distribution & Colab considerations
- Put `pip install` in the first cell; pin versions.
- Use forms (`#@param`) or ipywidgets for parameters when helpful.
- Save/cleanup artifacts to handle session resets.

Colab badge example (replace with your GitHub URL)
```
[Open in Colab](https://colab.research.google.com/github/daniel-p-green/alain-ai-learning-platform/blob/main/path/to/notebook.ipynb)
```

Colab form parameters
```
#@title Model and Runtime
HF_MODEL = 'org/name' #@param {type:'string'}
RUNTIME = 'gpt-oss' #@param ['gpt-oss','transformers']
OPENAI_BASE_URL = 'http://localhost:11434/v1' #@param {type:'string'}
```

11) Troubleshooting & cleanup
- Cover 401/403, 429 backoff, JSON validation, timeouts, and device issues.
- Cleanup caches and stop background processes if applicable.

## Code Snippets (Copy‑Ready)

Setup + seeds
```python
import os, sys, platform, random, time
print('Python:', sys.version)
print('Platform:', platform.platform())

import numpy as np
SEED = 42
random.seed(SEED); np.random.seed(SEED)
try:
    import torch
    torch.manual_seed(SEED)
    print('CUDA:', torch.cuda.is_available(), '\\nDevice:', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU')
except Exception as e:
    print('Torch not installed:', e)
```

OpenAI‑compatible GPT‑OSS quickstart (local Ollama/vLLM)
```python
from os import getenv
OPENAI_BASE_URL = getenv('OPENAI_BASE_URL', 'http://localhost:11434/v1')
OPENAI_API_KEY  = getenv('OPENAI_API_KEY',  'ollama')

from openai import OpenAI
client = OpenAI(base_url=OPENAI_BASE_URL, api_key=OPENAI_API_KEY)

def chat(prompt, model='gpt-oss:20b', temperature=0):
    t0 = time.time()
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role":"user","content":prompt}],
        temperature=temperature,
    )
    dt = time.time()-t0
    text = resp.choices[0].message.content
    usage = getattr(resp, 'usage', None)
    print(text)
    if usage:
        print('Tokens:', getattr(usage, 'total_tokens', None))
    print(f'Latency: {dt:.2f}s')
    return text

_ = chat('Say hello in five words.')
```

Transformers quickstart (auto‑detect text/vision)
```python
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
MODEL = 'org/name'  # replace with your HF path
try:
    tok = AutoTokenizer.from_pretrained(MODEL)
    model = AutoModelForCausalLM.from_pretrained(MODEL)
    textgen = pipeline('text-generation', model=model, tokenizer=tok)
    print(textgen('Hello, world', max_new_tokens=20)[0]['generated_text'])
except Exception as e:
    print('Falling back to generic pipeline:', e)
    try:
        anypipe = pipeline(model=MODEL)
        print(anypipe('Hello')[:1])
    except Exception as ee:
        print('Model not pipeline‑compatible:', ee)
```

MCQ cell (no widgets)
```python
question = "Which parameter most reduces randomness?"
options = ["top_p", "temperature", "max_tokens", "presence_penalty"]
correct_index = 1
explanation = "Lower temperature yields more deterministic outputs."

print(question)
for i, opt in enumerate(options):
    print(f"  {i}) {opt}")
choice = int(input('Your choice (0-3): ').strip() or -1)
if choice == correct_index:
    print('Correct!')
else:
    print(f'Not quite. {explanation}')
```

MCQ cell (ipywidgets if available)
```python
try:
    import ipywidgets as W
    from IPython.display import display
    dd = W.Dropdown(options=[(o,i) for i,o in enumerate(options)], description='Answer:')
    btn = W.Button(description='Submit')
    out = W.Output()
    def on_click(_):
        with out:
            out.clear_output()
            print('Correct!' if dd.value==correct_index else f'Not quite. {explanation}')
    btn.on_click(on_click)
    display(dd, btn, out)
except Exception as e:
    print('Widgets not available; using text input above.')
```

Tiny golden‑set evaluation (exact‑match)
```python
golden = [
    {"prompt":"2+2?", "expect":"4"},
    {"prompt":"Capital of France?", "expect":"Paris"},
]

ok = 0
for ex in golden:
    out = chat(ex['prompt'])  # or your transformers call
    ok += int(ex['expect'].lower() in out.lower())
acc = ok/len(golden)
print(f'Accuracy: {acc:.2%} ({ok}/{len(golden)})')
```

JSON/structured outputs with Pydantic (optional)
```python
try:
    from pydantic import BaseModel
    class Item(BaseModel):
        title: str
        rating: int
    print('Use Item.model_json_schema() to prompt for strict JSON and validate outputs.')
except Exception:
    print('Install pydantic for schema‑validated JSON outputs.')
```

Cost/latency logging helper
```python
import time

def timed(fn, *a, **kw):
    t0 = time.time(); val = fn(*a, **kw); dt = time.time()-t0
    print(f'Elapsed: {dt:.2f}s')
    return val
```

Pinned installs (first cell for Colab)
```python
# !pip -q install openai==1.43.0 transformers==4.44.2 datasets==2.20.0
```

## Content Patterns That Score Well
- Introduce minimal working examples early; delay theory until after success.
- Show 2–3 parameter tweaks and their effects with small diffs.
- Include at least one MCQ and 2+ exercises per major section.
- Keep code cells short (< 35 lines) and focused.
- Add a simple metric with a tiny golden set; print a few failures for reflection.
- Always print environment info, seeds, and (when available) tokens/latency.

## Curation Notes from the 529‑Notebook Sweep
- Most vendor notebooks excel at structure and clarity.
- Reproducibility and observability are often missing; always add seeds, pins, usage, and latency.
- Engagement is improved dramatically by short, focused MCQs and exercises.

## Final Checklist Before Publish
- Linter passes: `scripts/notebook_linter.py`
- Checklist passes: `docs/notebooks/notebook-quality-checklist.md`
- Smoke test runs: `pytest --nbmake path/to/notebook.ipynb -q`
- Colab‑ready: first cell installs pinned deps; secrets via env; runs in < 1 minute

## Debugging Playbook (Add These If Users Struggle)

Common issues and quick fixes you can copy into a Troubleshooting section.

- Local GPT‑OSS connection
  - Symptom: connection refused/timeouts. Check `OPENAI_BASE_URL` and server health.
  - Ollama: `curl http://localhost:11434/v1/models` → expect JSON. Ensure model pulled: `ollama pull gpt-oss:20b`.
  - vLLM: started with OpenAI server entrypoint; verify `GET /models` works.
  - Fix: set `OPENAI_BASE_URL` correctly; restart server; reduce `max_tokens`.

- Auth/keys
  - Symptom: 401/403. Fix: ensure `OPENAI_API_KEY`/provider key in env; never hardcode.
  - Anthropic/OpenAI cloud: confirm org permissions; rotate keys if needed.

- Transformers runtime
  - Model/tokenizer mismatch: set `trust_remote_code=True` for custom models when safe.
  - CUDA OOM: lower batch/sequence length; use `torch.float16/bfloat16`; CPU fallback; gradient checkpointing for fine‑tune.
  - Apple Silicon: prefer MPS (`torch.device("mps")`) or CPU; avoid unsupported dtypes.

- JSON/schema validation
  - Symptom: parse errors. Fix: enable model JSON/structured output if supported; otherwise add a repair pass and validate with Pydantic.

- Rate limits / 429 / retries
  - Implement exponential backoff; reduce concurrency; cache results; shorten prompts.

- Latency & throughput
  - Batch small calls; stream where supported; pre‑tokenize; enable kv‑cache; cache embeddings.

- Colab environment
  - Stuck on installs: restart runtime after large installs; ensure first cell pins versions.
  - Session resets: save artifacts to Drive; add a cleanup cell; keep quickstart small.

### Diagnostic Cells (Copy‑Paste)

Connectivity checks (GPT‑OSS)
```python
import os, requests
base = os.getenv('OPENAI_BASE_URL', 'http://localhost:11434/v1')
try:
    r = requests.get(base + '/models', timeout=5)
    print(r.status_code, r.text[:200])
except Exception as e:
    print('Conn error:', e)
```

GPU memory snapshot (PyTorch)
```python
try:
    import torch
    if torch.cuda.is_available():
        free, total = torch.cuda.mem_get_info()
        print('VRAM (GiB):', round(free/2**30,2), '/', round(total/2**30,2))
    else:
        print('CUDA not available')
except Exception as e:
    print('Torch not installed or mem_get_info unsupported:', e)
```

Hugging Face cache cleanup (use carefully)
```python
import shutil, os
cache = os.path.expanduser('~/.cache/huggingface')
print('HF cache at:', cache)
# shutil.rmtree(cache)  # Uncomment to clear cache (will re-download models)
```

Retry/backoff helper
```python
import time
def with_retry(fn, tries=3, backoff=1.5):
    for i in range(tries):
        try:
            return fn()
        except Exception as e:
            print(f'Attempt {i+1} error:', e)
            if i == tries-1: raise
            time.sleep(backoff**i)
```

JSON repair pass example
```python
import json, re
def try_json(text):
    try:
        return json.loads(text), None
    except Exception as e:
        # naive repair: strip code fences and trailing text
        cleaned = re.sub(r"```(json)?|```", "", text).strip()
        cleaned = re.sub(r"[^\{\}\[\]\:,\"\-0-9a-zA-Z\s]", "", cleaned)
        try:
            return json.loads(cleaned), None
        except Exception as ee:
            return None, (e, ee)
```

### When to Escalate
- Gated/private HF models: user needs access token; document how.
- Persistent OOM on target hardware: document required VRAM/alternatives (smaller model, quantization).
- Provider outages: link to status pages and suggest local fallback.
## Background, Release Notes, and License
- Add a short “About the Model” section: org, release date (from HF `lastModified`), license, intended use, and known limitations.
- Pull metadata with `huggingface_hub.HfApi().model_info(<org/name>)` and extract sections from the README (`Intended Use`, `Limitations`, etc.).
- Include an “Adjacent Models” list (same org/tag) to help users compare options.

## ELI5 & Metaphors (for busy readers)
- Generate short ELI5 explanations for Developer, PM, and CTO audiences using GPT‑OSS; otherwise fallback to a README extract.
- Add one concrete metaphor (e.g., “multitool writer”) and 3 good vs 2 poor tasks with one‑line rationale.

Code: HF metadata and ELI5 prompt
```
from huggingface_hub import HfApi
api = HfApi(); info = api.model_info('<org/name>')
print('Last modified:', info.lastModified, 'License:', info.license)

# If chat() available (GPT‑OSS), generate role‑tailored ELI5 summaries
prompt = '''Summarize the model for:
1) Developer ELI5
2) PM ELI5
3) CTO ELI5
Include constraints, cost/latency notes, and deployment shape.'''
_ = chat(prompt)
```
