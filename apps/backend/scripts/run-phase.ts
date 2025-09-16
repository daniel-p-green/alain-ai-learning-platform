#!/usr/bin/env -S bun
/**
 * ALAIN‑Kit Phase Runner
 *
 * Run phases individually, starting with: research
 *
 * Examples:
 *   bun scripts/run-phase.ts research --model gpt-oss-20b --provider openai --offline-cache
 *   bun scripts/run-phase.ts research --model gpt-oss-20b --github-token $GITHUB_TOKEN --offline-cache
 */

import { join, dirname } from 'path';
import { researchModel, generateResearchSummary } from '../utils/research';
import { loadAlainKitPrompt } from '../execution/prompts/loader';
import { mapModelForProvider } from '../execution/providers/aliases';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';

type ArgMap = Record<string, string | boolean>;

function parseArgs(argv: string[]): { cmd?: string; args: ArgMap } {
  const out: ArgMap = {};
  let cmd: string | undefined;
  const rest = argv.slice(2);
  if (rest.length > 0) {
    cmd = rest[0];
  }
  for (let i = 1; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const key = a.replace(/^--/, '');
      const next = rest[i + 1];
      if (!next || next.startsWith('--')) {
        out[key] = true; // boolean flag
      } else {
        out[key] = next;
        i++;
      }
    }
  }
  return { cmd, args: out };
}

function printHelp() {
  console.log(`ALAIN‑Kit Phase Runner\n\nUsage:\n  bun scripts/run-phase.ts <phase> [options]\n\nPhases:\n  research   Gather and cache model info for offline use\n  design     Generate learning experience design from research\n  develop    Generate implementation guidance / code from design\n  validate   Generate validation and QA checks\n\nOptions (research):\n  --model <name>           Model id (e.g., gpt-oss-20b)\n  --provider <org>         Hugging Face org for model path (default: openai)\n  --offline-cache          Download small files for offline use (HF, Unsloth, Cookbook)\n  --github-token <token>   GitHub token to avoid rate limits\n  --max-bytes <n>          Per-file byte cap for downloads (default: 5242880)\n  --query <text>           Extra keywords to improve GitHub searches\n\nOptions (design/develop/validate):\n  --teacher-model <name>   Teacher model (default: GPT-OSS-20B)\n  --provider <id>          Provider: openai-compatible | poe (default: openai-compatible)\n  --openai-base <url>      Override OPENAI_BASE_URL\n  --openai-key <key>       Override OPENAI_API_KEY\n  --poe-key <key>          Override POE_API_KEY\n  --research-dir <path>    Path to research dir to include summary\n  --input <text>           Additional user context/instructions\n  --input-file <path>      Load additional user context from file\n  --out-dir <path>         Output directory (default: resources/content/phases/<model>/<phase>)\n`);
}

async function run() {
  const { cmd, args } = parseArgs(process.argv);
  if (!cmd || cmd === 'help' || cmd === '-h' || cmd === '--help') return printHelp();

  const repoRoot = join(__dirname, '../../..'); // write to repo root/resources/content
  if (cmd === 'research') {
    const model = String(args.model || '').trim();
    const provider = String(args.provider || 'openai').trim();
    const offline = !!args['offline-cache'];
    const token = (String(args['github-token'] || process.env.GITHUB_TOKEN || '')).trim() || undefined;
    const maxBytes = args['max-bytes'] ? Number(args['max-bytes']) : undefined;
    const query = String(args['query'] || '').trim() || undefined;
    if (!model) {
      console.error('Missing --model <name>. Example: --model gpt-oss-20b');
      process.exit(2);
    }
    console.log(`\n🚀 Running research phase for ${provider}/${model} (offline-cache=${offline ? 'on' : 'off'})`);
    const dir = await researchModel(model, provider, repoRoot, { offlineCache: offline, githubToken: token, maxBytes, query });
    console.log('\n📊 Summary:');
    const summary = generateResearchSummary(dir);
    console.log('\n' + summary);
    console.log(`📁 Output: ${dir}`);
    return;
  }

  if (cmd === 'design' || cmd === 'develop' || cmd === 'validate') {
    const teacherModel = String(args['teacher-model'] || 'GPT-OSS-20B');
    const provider = (String(args['provider'] || 'openai-compatible') as 'openai-compatible' | 'poe');
    const openaiBase = String(args['openai-base'] || process.env.OPENAI_BASE_URL || '').trim();
    const openaiKey = String(args['openai-key'] || process.env.OPENAI_API_KEY || '').trim();
    const poeKey = String(args['poe-key'] || process.env.POE_API_KEY || '').trim();
    const researchDir = String(args['research-dir'] || '').trim();
    const input = String(args['input'] || '').trim();
    const inputFile = String(args['input-file'] || '').trim();
    const outDirArg = String(args['out-dir'] || '').trim();

    // Assemble user context
    let userContext = '';
    if (researchDir) {
      try {
        userContext += `\n\n# Research Summary\n${generateResearchSummary(researchDir)}\n`;
      } catch {}
    }
    if (input) userContext += `\n\n# Additional Context\n${input}\n`;
    if (inputFile) {
      try { userContext += `\n\n# File Context (${inputFile})\n${readFileSync(inputFile, 'utf-8')}\n`; } catch {}
    }
    if (!userContext.trim()) userContext = 'Generate the requested phase output using best practices.';

    // Compose harmony messages
    const { system, developer } = loadAlainKitPrompt(cmd as any);
    const supportsDeveloper = provider === 'openai-compatible';
    const messages: Array<{ role: string; content: string }> = [];
    if (supportsDeveloper) {
      messages.push({ role: 'system', content: system });
      messages.push({ role: 'developer', content: developer });
    } else {
      messages.push({ role: 'system', content: `${system}\n\n${developer}` });
    }
    messages.push({ role: 'user', content: userContext });

    // Provider call
    const modelForProvider = mapModelForProvider(provider, teacherModel);
    const content = await callChat(provider, modelForProvider, messages, {
      openaiBase,
      openaiKey,
      poeKey,
    });

    // Write outputs
    const modelSlug = teacherModel.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const phase = cmd;
    const outDir = outDirArg || join(rootDir, 'content', 'phases', modelSlug, phase);
    ensureDir(outDir + '/.keep');
    const rawPath = join(outDir, 'output.txt');
    writeFileSync(rawPath, content || '');
    // Also save JSON if parseable
    try {
      const j = JSON.parse(stripFences(content));
      writeFileSync(join(outDir, 'output.json'), JSON.stringify(j, null, 2));
    } catch {}
    console.log(`✅ ${phase} content generated → ${outDir}`);
    return;
  }

  console.error(`Unknown phase '${cmd}'.`);
  printHelp();
  process.exit(2);
}

run().catch((err) => {
  console.error('Command failed:', err?.message || err);
  process.exit(1);
});

// Helpers
function ensureDir(p: string) {
  try { mkdirSync(dirname(p), { recursive: true }); } catch {}
}

function stripFences(s: string): string {
  let t = (s || '').trim();
  if (t.startsWith('```')) t = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
  return t;
}

async function callChat(
  provider: 'openai-compatible' | 'poe',
  model: string,
  messages: Array<{ role: string; content: string }>,
  opts: { openaiBase?: string; openaiKey?: string; poeKey?: string }
): Promise<string> {
  if (provider === 'poe') {
    const key = (opts.poeKey || '').trim();
    if (!key) throw new Error('POE_API_KEY missing. Provide --poe-key or set env.');
    const resp = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ALAIN-Phases/1.0'
      },
      body: JSON.stringify({ model, messages, stream: false, temperature: 0.2, max_tokens: 2048 })
    });
    if (!resp.ok) throw new Error(`Poe error ${resp.status}: ${await resp.text().catch(()=>'')}`);
    const data: any = await resp.json();
    return extractContent(data);
  } else {
    const base = (opts.openaiBase || process.env.OPENAI_BASE_URL || '').replace(/\/$/, '');
    const key = opts.openaiKey || process.env.OPENAI_API_KEY || '';
    if (!base || !key) throw new Error('OPENAI_BASE_URL and OPENAI_API_KEY required. Provide flags or set env.');
    const resp = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ALAIN-Phases/1.0'
      },
      body: JSON.stringify({ model, messages, temperature: 0.2, max_tokens: 3072 })
    });
    if (!resp.ok) throw new Error(`OpenAI-compatible error ${resp.status}: ${await resp.text().catch(()=>'')}`);
    const data: any = await resp.json();
    return extractContent(data);
  }
}

function extractContent(data: any): string {
  try {
    const choice = data?.choices?.[0];
    const msg = choice?.message || {};
    return msg?.content || '';
  } catch {
    return '';
  }
}
