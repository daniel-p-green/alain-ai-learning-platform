#!/usr/bin/env python3
import csv, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BENCH = ROOT / 'bench'
ANALYSIS = BENCH / 'analysis'
ANALYSIS.mkdir(parents=True, exist_ok=True)

metrics_csv = ANALYSIS / 'notebooks_metrics.csv'
combined_csv = ANALYSIS / 'combined.csv'
summary_md = ANALYSIS / 'summary.md'

def load_quality_scores():
    scores = {}
    for md in BENCH.glob('**/validation.md'):
        try:
            txt = md.read_text(encoding='utf-8', errors='ignore')
        except Exception:
            continue
        score = None
        for ln in txt.splitlines():
            if 'Score:' in ln:
                # formats: "**Score:** 80/100" or "Quality Score: 80/100"
                for tok in ln.replace('*','').split():
                    if '/' in tok:
                        head = tok.split('/')[0]
                        if head.isdigit():
                            score = int(head)
                            break
            if score is not None:
                break
        if score is not None:
            scores[str(md)] = score
    return scores

def target_from_path(p: str) -> str:
    parts = Path(p).parts
    if 'bench' in parts:
        i = parts.index('bench')
        if i+1 < len(parts):
            return parts[i+1]
    return 'unknown'

def main():
    if not metrics_csv.exists():
        print(f"Metrics CSV not found: {metrics_csv}")
        return
    q_scores = load_quality_scores()
    rows = []
    with metrics_csv.open(newline='') as f:
        reader = csv.DictReader(f)
        for r in reader:
            path = r.get('path','')
            tgt = target_from_path(path)
            md_path = str(BENCH / tgt / 'validation.md')
            quality = q_scores.get(md_path, '')
            rows.append({
                'target': tgt,
                'notebook_path': path,
                'quality_score': quality,
                'steps': r.get('estimated_steps',''),
                'markdown_ratio': r.get('markdown_ratio',''),
                'markdown_words': r.get('markdown_words',''),
                'total_tokens_est': r.get('total_tokens_est',''),
                'fk_grade': r.get('fk_grade',''),
                'estimated_time_min': r.get('estimated_time_min',''),
                'cells': r.get('num_cells',''),
                'md_cells': r.get('num_markdown_cells',''),
                'code_cells': r.get('num_code_cells','')
            })
    fields = ['target','quality_score','steps','markdown_ratio','markdown_words','total_tokens_est','fk_grade','estimated_time_min','cells','md_cells','code_cells','notebook_path']
    with combined_csv.open('w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in rows:
            w.writerow(r)
    # Markdown summary
    by_target = {}
    for r in rows:
        by_target.setdefault(r['target'], []).append(r)
    out = ["# Benchmark Summary\n"]
    for tgt in sorted(by_target.keys()):
        r = by_target[tgt][0]
        out.append(f"## {tgt}")
        out.append(f"- Quality: {r['quality_score']} / 100")
        try:
            md_ratio = float(r['markdown_ratio'])
            fk = float(r['fk_grade'])
            tmin = float(r['estimated_time_min'])
            out.append(f"- Steps: {r['steps']}  •  MD ratio: {md_ratio:.2f}")
            out.append(f"- Tokens: {r['total_tokens_est']}  •  Words: {r['markdown_words']}")
            out.append(f"- FK Grade: {fk:.2f}  •  Time: {tmin:.1f} min")
        except Exception:
            out.append(f"- Steps: {r['steps']}  •  MD ratio: {r['markdown_ratio']}")
            out.append(f"- Tokens: {r['total_tokens_est']}  •  Words: {r['markdown_words']}")
            out.append(f"- FK Grade: {r['fk_grade']}  •  Time: {r['estimated_time_min']} min")
        out.append(f"- Cells: {r['cells']} (md {r['md_cells']}, code {r['code_cells']})\n")
    summary_md.write_text("\n".join(out), encoding='utf-8')
    print(f"Wrote: {combined_csv}\nWrote: {summary_md}")

if __name__ == '__main__':
    main()
