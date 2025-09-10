# Reusable Notebook Snippets

Note: some snippets fetch remote resources (e.g., Hugging Face). Guard or skip in CI/offline runs.

Use these drop-in code cells in any new notebook to enrich model background, license clarity, and risk awareness.

## Intended Use & Limitations (from Hugging Face README)
```python
import re, requests

def fetch_readme(org_model: str, timeout: int = 10) -> str | None:
    url = f"https://huggingface.co/{org_model}/raw/main/README.md"
    try:
        r = requests.get(url, timeout=timeout)
        if r.status_code == 200:
            return r.text
    except Exception as e:
        print("Fetch error:", e)
    return None

def extract_sections(md_text: str, sections: list[str]) -> dict[str, str]:
    out = {}
    for sec in sections:
        m = re.search(r'(^|\n)#+\s*' + re.escape(sec) + r'[^\n]*\n(.+?)(\n#+|\Z)', md_text, re.S | re.I)
        if m:
            out[sec] = m.group(2).strip()
    return out

HF_MODEL = HF_MODEL if 'HF_MODEL' in globals() else 'org/name'
md = fetch_readme(HF_MODEL)
sections = extract_sections(md or '', [
    'Intended Use', 'Use cases', 'Limitations', 'Risks', 'Training data'
])
for k, v in sections.items():
    print(f"\n--- {k} ---\n")
    print('\n'.join(v.splitlines()[:30]))
```

## License Snippet + “What This License Means for You”
```python
try:
    from huggingface_hub import HfApi, hf_hub_download
    import os
    api = HfApi()
    info = api.model_info(HF_MODEL)
    lic = getattr(info, 'license', None)
    print('License identifier:', lic)

    # Try to download a license file
    path = None
    for name in ['LICENSE', 'LICENSE.txt', 'LICENSE.md', 'LICENSE.MD', 'license', 'LICENSE.rst']:
        try:
            path = hf_hub_download(repo_id=HF_MODEL, filename=name, revision='main')
            break
        except Exception:
            pass

    if path and os.path.exists(path):
        text = open(path, 'r', encoding='utf-8', errors='ignore').read()
        print('\n--- License snippet (first 1500 chars) ---\n')
        print(text[:1500])
    else:
        print('License file not found; see model card.')

    summary = {
        'mit': 'Permissive: commercial use allowed, attribution and license notice required; no warranty.',
        'apache-2.0': 'Permissive with patent grant: commercial use allowed; keep NOTICE; mind patents/trademarks.',
        'bsd-3-clause': 'Permissive: commercial use allowed; attribution required; no endorsement.',
        'gpl-3.0': 'Copyleft: derivatives must be GPL; not suitable for closed-source distribution.',
        'lgpl-3.0': 'Weak copyleft: dynamic linking OK; modified library must remain LGPL.',
        'agpl-3.0': 'Network copyleft: providing as a service triggers source-sharing obligations.',
        'cc-by-4.0': 'Attribution required; commercial use allowed; keep notices.',
        'cc-by-nc-4.0': 'Non-commercial: no commercial use permitted; attribution required.',
        'openrail': 'Responsible AI License: usage restrictions apply; review terms for safety/commercial limits.',
        'openrail++': 'Responsible AI License: stricter usage constraints; check allowed and disallowed uses.',
    }
    key = (lic or '').lower()
    explain = None
    for k, v in summary.items():
        if k in key:
            explain = v; break

    print('\n--- What this license means for you ---\n')
    if explain:
        print(explain)
    else:
        print('Review the license in the model card. Typical items: attribution, redistribution terms, commercial-use scope, and safety constraints.')
except Exception as e:
    print('License lookup error:', e)
```
