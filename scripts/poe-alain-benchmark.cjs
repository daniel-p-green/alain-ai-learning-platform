#!/usr/bin/env node
/**
 * ALAIN x Poe Benchmark Runner
 *
 * Runs the ALAIN CLI against a roster of Poe-hosted teacher models.
 * For each model we execute the beginner remix flow (and optionally
 * the gpt-oss-20b generation flow at multiple difficulties).
 *
 * Usage:
 *   POE_API_KEY=... npx -y tsx scripts/poe-alain-benchmark.cjs [--quick] [--only model1,model2]
 *                                                       [--outDir path] [--remixSource file]
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MODELS_DEFAULT = [
  'gpt-5',
  'gpt-oss-120b',
  'gpt-oss-20b',
  'Gemini-2.5-pro',
  'Gemini-2.5-flash',
  'Claude-opus-4.1',
  'GPT-5-chat',
  'Claude-sonnet-4',
  'Qwen3-next-80b',
  'kimi-k2'
];
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

const ROOT = path.resolve(__dirname, '..');
const CLI = path.join(ROOT, 'packages', 'alain-kit-sdk', 'bin', 'alain-kit.ts');
const DEFAULT_BASE_URL = process.env.POE_BASE_URL || 'https://api.poe.com';
const REMIX_DEFAULT = path.join(ROOT, 'content', 'notebooks', 'gpt-5_prompting_guide.ipynb');
const OUT_ROOT_DEFAULT = path.join(ROOT, 'benchmark_output');

function parseArgs(argv) {
  const args = new Set(argv);
  const has = (flag) => args.has(flag);
  const getValue = (flag, fallback) => {
    const idx = argv.indexOf(flag);
    if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
    return fallback;
  };
  const onlyRaw = getValue('--only', null);
  const only = onlyRaw ? onlyRaw.split(',').map(s => s.trim()).filter(Boolean) : null;
  return {
    quick: has('--quick'),
    outDir: path.resolve(getValue('--outDir', OUT_ROOT_DEFAULT)),
    remixSource: path.resolve(getValue('--remixSource', REMIX_DEFAULT)),
    models: only && only.length ? only : MODELS_DEFAULT
  };
}

function listNewest(dir, pattern) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(name => pattern.test(name))
    .map(name => ({ name, path: path.join(dir, name), mtime: fs.statSync(path.join(dir, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);
}

function readJSONIfExists(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function notebookStats(nbPath) {
  const stats = { headings: 0, links: 0, fences: 0, linkList: [] };
  try {
    const nb = JSON.parse(fs.readFileSync(nbPath, 'utf8'));
    const seen = new Set();
    for (const cell of nb.cells || []) {
      if (cell.cell_type !== 'markdown') continue;
      const text = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source || '');
      stats.headings += (text.match(/^#{1,3}\s+/gm) || []).length;
      stats.links += (text.match(/\[[^\]]+\]\((https?:\/\/[^)]+)\)/g) || []).length;
      stats.fences += (text.match(/```/g) || []).length;
      const re = /\[[^\]]+\]\((https?:\/\/[^)]+)\)/g;
      let m;
      while ((m = re.exec(text))) {
        seen.add(m[1]);
      }
    }
    stats.linkList = Array.from(seen);
  } catch {
    // ignore parse errors
  }
  return stats;
}

async function linkCheck(urls) {
  const results = await Promise.all(urls.map(async (url) => {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      return { url, ok: res.ok };
    } catch {
      return { url, ok: false };
    }
  }));
  const fail = results.filter(r => !r.ok).map(r => r.url);
  return {
    total: urls.length,
    ok: urls.length - fail.length,
    fail: fail.length,
    failed: fail.slice(0, 5)
  };
}

function scoreRun(metrics) {
  if (!metrics || typeof metrics !== 'object') return 0;
  const quality = Number(metrics.qualityScore || metrics.qualityMetrics?.qualityScore || 0);
  const colabBonus = metrics.colabCompatible ? 5 : 0;
  const fk = metrics.readability?.fkGrade ?? 14;
  const fkScore = Math.max(0, 20 - Math.abs(16 - fk)) * 1.5;
  const mdRatio = metrics.readability?.markdownRatio ?? 0.55;
  const mdScore = Math.max(0, 20 - Math.abs(0.57 - mdRatio) * 100);
  const steps = metrics.qualityMetrics?.stepCount ?? metrics.sectionCount ?? 0;
  const stepsScore = steps >= 6 && steps <= 12 ? 10 : 0;
  return Math.round(Math.min(100, quality + colabBonus + fkScore + mdScore + stepsScore));
}

async function sh(cmd, args, opts = {}) {
  return await new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...(opts.env || {}) }
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => stdout += chunk.toString());
    child.stderr.on('data', (chunk) => stderr += chunk.toString());
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function poePing(model, key, baseUrl) {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: 'ping' }], max_tokens: 1 })
    });
    if (!res.ok) {
      return { ok: false, status: res.status, body: await res.text() };
    }
    const json = await res.json();
    const hasContent = Boolean(json?.choices?.[0]?.message?.content);
    return { ok: hasContent, status: res.status };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

async function runRemix(model, options) {
  const { baseUrl, apiKey, remixSource, outDir, quick } = options;
  const destDir = path.join(outDir, model.replace(/[^A-Za-z0-9_.-]+/g, '_'), 'remix');
  fs.mkdirSync(destDir, { recursive: true });
  const args = ['-y', 'tsx', CLI,
    '--model', model,
    '--apiKey', apiKey,
    '--baseUrl', baseUrl,
    '--maxSections', quick ? '3' : '6',
    '--outDir', destDir,
    '--remix', remixSource
  ];
  const run = await sh('npx', args);
  const metricsFile = listNewest(destDir, /^alain-metrics-.*\.json$/)[0]?.path;
  const notebookFile = listNewest(destDir, /\.ipynb$/)[0]?.path;
  const metrics = metricsFile ? readJSONIfExists(metricsFile) : { error: 'no_metrics' };
  const stats = notebookFile ? notebookStats(notebookFile) : null;
  const linkSummary = stats ? await linkCheck(stats.linkList) : null;
  return {
    kind: 'remix',
    model,
    outDir: destDir,
    metricsFile,
    notebookFile,
    metrics,
    stats,
    linkSummary,
    score: scoreRun(metrics),
    log: run.stderr || run.stdout
  };
}

async function runGenerations(options) {
  const { baseUrl, apiKey, modelDir, quick } = options;
  if (quick) return [];
  const results = [];
  for (const diff of DIFFICULTIES) {
    const destDir = path.join(modelDir, `gen_${diff}`);
    fs.mkdirSync(destDir, { recursive: true });
    const args = ['-y', 'tsx', CLI,
      '--model', 'gpt-oss-20b',
      '--apiKey', apiKey,
      '--baseUrl', baseUrl,
      '--difficulty', diff,
      '--maxSections', '6',
      '--outDir', destDir
    ];
    const run = await sh('npx', args);
    const metricsFile = listNewest(destDir, /^alain-metrics-.*\.json$/)[0]?.path;
    const notebookFile = listNewest(destDir, /\.ipynb$/)[0]?.path;
    const metrics = metricsFile ? readJSONIfExists(metricsFile) : { error: 'no_metrics' };
    const linkSummary = notebookFile ? await linkCheck(notebookStats(notebookFile).linkList) : null;
    results.push({
      kind: 'generate',
      model: 'gpt-oss-20b',
      difficulty: diff,
      outDir: destDir,
      metricsFile,
      notebookFile,
      metrics,
      linkSummary,
      score: scoreRun(metrics),
      log: run.stderr || run.stdout
    });
  }
  return results;
}

async function runOne(model, options) {
  const modelDir = path.join(options.outDir, model.replace(/[^A-Za-z0-9_.-]+/g, '_'));
  fs.mkdirSync(modelDir, { recursive: true });
  const items = [];

  const ping = await poePing(model, options.apiKey, options.baseUrl);
  if (!ping.ok) {
    const parts = [];
    if (ping.status) parts.push(String(ping.status));
    if (ping.error) parts.push(ping.error);
    if (ping.body) parts.push(ping.body.toString().slice(0, 200));
    items.push({ kind: 'error', model, error: `preflight_failed: ${parts.join(' ').trim() || 'unknown'}` });
  }

  items.push(await runRemix(model, options));
  items.push(...await runGenerations({ baseUrl: options.baseUrl, apiKey: options.apiKey, modelDir, quick: options.quick }));

  return items;
}

function formatMarkdown(summary, durationMin) {
  const lines = ['# ALAIN x Poe Benchmark Summary', '', `Duration: ${durationMin} min`, ''];
  for (const item of summary) {
    if (item.kind === 'error') {
      lines.push(`- ${item.model}: ❌ ${item.error}`);
      continue;
    }
    const metrics = item.metrics || {};
    const quality = metrics.qualityScore ?? metrics.qualityMetrics?.qualityScore ?? 'n/a';
    const colab = metrics.colabCompatible ? '✅' : '⚠️';
    const fk = metrics.readability?.fkGrade ? metrics.readability.fkGrade.toFixed(1) : 'n/a';
    const mdRatio = metrics.readability?.markdownRatio ? `${(metrics.readability.markdownRatio * 100).toFixed(1)}%` : 'n/a';
    const extras = [];
    if (item.kind === 'generate') extras.push(`Difficulty ${item.difficulty}`);
    if (item.linkSummary) extras.push(`Links ${item.linkSummary.ok}/${item.linkSummary.total} ok`);
    lines.push(`- ${item.model} • ${item.kind === 'remix' ? 'Remix(beginner)' : 'Gen'} → Score ${item.score} | Quality ${quality} | Colab ${colab} | FK ${fk} | MD ${mdRatio}${extras.length ? ' | ' + extras.join(' | ') : ''}`);
  }
  return lines.join('\n');
}

async function main() {
  const argv = process.argv.slice(2);
  const options = parseArgs(argv);
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) {
    console.error('❌ POE_API_KEY not set. Export it or add it to your .env file.');
    process.exit(1);
  }
  if (!fs.existsSync(options.remixSource)) {
    console.error(`❌ Remix source not found: ${options.remixSource}`);
    process.exit(1);
  }
  fs.mkdirSync(options.outDir, { recursive: true });

  const started = Date.now();
  const summary = [];

  for (const model of options.models) {
    console.log(`\n=== Running model: ${model} ===`);
    try {
      const items = await runOne(model, {
        baseUrl: DEFAULT_BASE_URL,
        apiKey,
        remixSource: options.remixSource,
        outDir: options.outDir,
        quick: options.quick
      });
      summary.push(...items);
    } catch (error) {
      summary.push({ kind: 'error', model, error: String(error) });
    }
  }

  const durationMin = ((Date.now() - started) / 60000).toFixed(1);
  const summaryJson = {
    duration_min: durationMin,
    quick: options.quick,
    items: summary
  };
  const summaryPath = path.join(options.outDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaryJson, null, 2));

  const markdownPath = path.join(options.outDir, 'summary.md');
  fs.writeFileSync(markdownPath, formatMarkdown(summary, durationMin));

  console.log('\n📊 Summary written to:');
  console.log(`- ${summaryPath}`);
  console.log(`- ${markdownPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
