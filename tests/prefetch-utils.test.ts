import { describe, it, expect } from 'vitest';
import type { SpecMetadata } from '../scripts/prefetch.ts';
import { parseFrontMatter, harvestFrontMatter, harvestEvalEntriesFromText, computeCoverage } from '../scripts/prefetch.ts';

describe('prefetch utilities', () => {
  it('harvests nested front matter fields', () => {
    const yaml = `architectures:\n  - t5\nparameters: 1100000000\nlicense:\n  spdx: apache-2.0\n  finetune: allowed\ninference:\n  min_hardware: NVIDIA A100\n  servers:\n    - vllm\n  quantization:\n    - awq\n`;
    const parsed = parseFrontMatter(yaml);
    expect(parsed).toBeTruthy();
    const meta: SpecMetadata = {};
    harvestFrontMatter(meta, parsed!);
    expect(meta.architecture).toBe('t5');
    expect(meta.parameters).toBe('1.1B');
    expect(meta.license_details?.spdx).toBe('apache-2.0');
    expect(meta.inference?.min_hardware).toMatch(/A100/);
    expect(meta.inference?.servers).toEqual(['vllm']);
    expect(meta.inference?.quantization).toEqual(['awq']);
  });

  it('extracts eval rows from markdown tables and html', () => {
    const md = `| Benchmark | Dataset | Metric | Score |\n| --- | --- | --- | --- |\n| MMLU | mmlu | Accuracy | 67.2 |`;
    const html = `<table><tr><th>Benchmark</th><th>Dataset</th><th>Score</th></tr><tr><td>ARC</td><td>arc-easy</td><td>78.4</td></tr></table>`;
    const mdEvals = harvestEvalEntriesFromText(md, 'README');
    expect(mdEvals).toHaveLength(1);
    expect(mdEvals[0]).toMatchObject({ benchmark: 'MMLU', dataset: 'mmlu', metric: 'Accuracy', score: '67.2', source: 'README' });
    const htmlEvals = harvestEvalEntriesFromText(html, 'link');
    expect(htmlEvals).toHaveLength(1);
    expect(htmlEvals[0]).toMatchObject({ benchmark: 'ARC', dataset: 'arc-easy', score: '78.4', source: 'link' });
  });

  it('computes coverage summary', () => {
    const meta: SpecMetadata = {
      architecture: 't5',
      parameters: '1.1B',
      context_window: '2048',
      tokenizer: 'SentencePiece',
      license: 'apache-2.0',
      primary_repo: 'google-research/t5x',
      evals: [{ benchmark: 'MMLU', dataset: 'mmlu', metric: 'Accuracy', score: '67.2', source: 'README' }],
      inference: { min_hardware: 'A100 40GB' },
      tokenizer_details: { vocab_size: '32128' },
      license_details: { spdx: 'apache-2.0' }
    };
    const coverage = computeCoverage(meta);
    expect(coverage.filled).toBeGreaterThanOrEqual(9);
    expect(coverage.missing).not.toContain('architecture');
    expect(coverage.total).toBe(10);
  });
});
