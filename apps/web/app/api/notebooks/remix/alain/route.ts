import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { putNotebook, getNotebook, type NotebookMeta } from '@/lib/notebookStore';
import { parseGhId, fetchPublicNotebook } from '@/lib/githubRaw';

export const runtime = 'nodejs';

type ReqBody = {
  id?: string; // existing store id or gh:owner/repo@ref:path
  baseUrl?: string; // provider root, e.g., http://localhost:1234
  model?: string;   // e.g., openai/gpt-oss-20b
  maxSections?: number; // default 8
};

function md(text: string | string[]) {
  return { cell_type: 'markdown', metadata: {}, source: Array.isArray(text) ? text : [String(text)] } as any;
}

function asText(src: any): string { return Array.isArray(src) ? src.join('') : String(src || ''); }
function inferTitle(nb: any): string {
  const cells = Array.isArray(nb?.cells) ? nb.cells : [];
  for (const c of cells) {
    if (c?.cell_type === 'markdown') {
      const m = asText(c.source).match(/^#\s+(.+)$/m);
      if (m) return m[1].trim();
    }
  }
  return nb?.metadata?.title || 'Notebook';
}
function extractHeadings(nb: any, limit = 8): string[] {
  const heads: string[] = [];
  const cells = Array.isArray(nb?.cells) ? nb.cells : [];
  for (const c of cells) {
    if (c?.cell_type !== 'markdown') continue;
    const lines = asText(c.source).split(/\r?\n/);
    for (const line of lines) {
      const m = /^(#{1,3})\s+(.+)/.exec(line.trim());
      if (m) heads.push(m[2].trim());
      if (heads.length >= limit) return heads;
    }
  }
  return heads;
}
function extractPlainText(nb: any, maxChars = 8000): string {
  let out = '';
  const cells = Array.isArray(nb?.cells) ? nb.cells : [];
  for (const c of cells) {
    if (c?.cell_type === 'markdown') {
      out += asText(c.source) + '\n\n';
      if (out.length >= maxChars) break;
    }
  }
  return out.slice(0, maxChars);
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    const body = await req.json().catch(() => ({} as ReqBody)) as ReqBody;
    const id = (body.id || '').trim();
    const baseUrl = (body.baseUrl || process.env.OPENAI_BASE_URL || '').replace(/\/$/, '') || 'http://localhost:1234';
    const model = body.model || process.env.MODEL_REF || 'openai/gpt-oss-20b';
    const maxSections = Math.max(3, Math.min(12, Number(body.maxSections || 8)));

    // Load source notebook from store or GitHub pointer
    let nb: any | null = null;
    let title = 'Notebook';
    let sourceOrg: string | undefined;
    if (id) {
      const mem = getNotebook(id);
      if (mem) { nb = mem.nb; title = mem.meta?.title || title; }
      if (!nb) {
        const gh = parseGhId(id);
        if (gh) {
          const got = await fetchPublicNotebook(gh);
          nb = got.nb; title = got.meta.title; sourceOrg = gh.owner;
        }
      }
    }
    if (!nb) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const subject = `${title} — ELI5 Remix`;
    const heads = extractHeadings(nb);
    const excerpt = extractPlainText(nb);

    // Minimal inline generation (avoid monorepo imports in Next build)
    const outline = await generateOutlineLM({ baseUrl, model, subject, heads, excerpt });
    const sections: any[] = [];
    const total = Math.min(maxSections, outline.outline?.length || 6);
    for (let i = 1; i <= total; i++) {
      const sec = await generateSectionLM({ baseUrl, model, outline, sectionNumber: i, previousSections: sections });
      sections.push(sec);
    }

    const built = buildNotebookMinimal(outline as any, sections as any);
    // Prepend required ALAIN credit cell
    const credit = md([
      '---\n',
      '**Remix Note**: This ELI5 version was created with the Applied Learning AI Notebooks (ALAIN) Project on 09.14.2025.\\n',
      'Created by [Daniel Green](https://www.linkedin.com/in/danielpgreen).\\n',
      '---\n\n'
    ]);
    built.cells.unshift(credit);
    built.metadata = {
      ...(built.metadata || {}),
      remix: true,
      remix_source: id,
      remix_date: '2025-09-14',
      remix_by: 'Daniel Green',
      remix_by_link: 'https://www.linkedin.com/in/danielpgreen'
    } as any;

    // Store and return
    const newId = 'remix-' + Math.random().toString(36).slice(2, 10);
    const meta: NotebookMeta = {
      id: newId,
      title: subject,
      sourceType: 'user',
      sourceOrg,
      tags: ['remix', 'eli5', 'alain'],
      remixOfId: id,
      createdAt: new Date().toISOString()
    } as any;
    putNotebook({ meta, nb: built });
    return NextResponse.json({ ok: true, id: newId, meta });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'remix_failed' }, { status: 500 });
  }
}

// ---- Local helpers (LM Studio outline/section + minimal builder) ----
async function chatJSON(baseUrl: string, model: string, messages: any[], max_tokens = 2000, temperature = 0.1): Promise<any> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer local' }, body: JSON.stringify({ model, messages, max_tokens, temperature }) });
  if (!resp.ok) throw new Error(`http_${resp.status}`);
  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  return safeJson(content);
}
function safeJson(s: string): any {
  try { return JSON.parse(s); } catch {}
  const i = s.indexOf('{');
  const j = s.lastIndexOf('}');
  if (i !== -1 && j !== -1 && j > i) {
    try { return JSON.parse(s.slice(i, j + 1)); } catch {}
  }
  return {};
}
async function generateOutlineLM(opts: { baseUrl: string; model: string; subject: string; heads: string[]; excerpt: string }) {
  const { baseUrl, model, subject, heads, excerpt } = opts;
  const prompt = `You are ALAIN-Teacher. Return ONLY valid JSON.\n\nCreate a beginner (ELI5) tutorial outline with: title, overview (2-3 sentences), objectives (4), setup (requirements array), outline (6-10 steps), assessments (>=2 MCQs), summary, next_steps, references.\nAudience: non-developers. Use analogies.\n\nSubject: ${subject}\nHeadings: ${heads.join(' | ')}\nExcerpt:\n${excerpt}`;
  const json = await chatJSON(baseUrl, model, [{ role: 'user', content: prompt }], 1800, 0.1);
  // Minimal validation/repair
  if (!Array.isArray(json?.assessments) || json.assessments.length < 2) {
    json.assessments = [
      { question: 'Quick check: What is a prompt?', options: ['A message for AI', 'A bug', 'A file'], correct_index: 0, explanation: 'A prompt is how you tell AI what to do.' },
      { question: 'Why examples help?', options: ['Reduce guesswork', 'Make it slower', 'No reason'], correct_index: 0, explanation: 'Examples anchor the format and style you want.' }
    ];
  }
  if (!Array.isArray(json?.outline)) {
    json.outline = Array.from({ length: 6 }, (_, i) => ({ step: i + 1, title: `Step ${i + 1}`, type: 'concept', estimated_tokens: 250, content_type: 'markdown + code' }));
  }
  return json;
}
async function generateSectionLM(opts: { baseUrl: string; model: string; outline: any; sectionNumber: number; previousSections: any[] }) {
  const { baseUrl, model, outline, sectionNumber, previousSections } = opts;
  const current = outline?.outline?.[sectionNumber - 1] || {};
  const prompt = `Generate ONLY valid JSON for a single section:\n{\n  "section_number": ${sectionNumber},\n  "title": "${current.title || `Step ${sectionNumber}`}",\n  "content": [ { "cell_type": "markdown", "source": "## ${current.title || `Step ${sectionNumber}`}\\n\\nExplain simply with analogies." } ]\n}\nAudience: absolute beginners. Avoid jargon. Keep code optional.`;
  const json = await chatJSON(baseUrl, model, [{ role: 'user', content: prompt }], 900, 0.2);
  // Ensure minimal shape
  if (!Array.isArray(json?.content)) {
    json.content = [{ cell_type: 'markdown', source: `## ${current.title || `Step ${sectionNumber}`}\n\nExplanation...` }];
  }
  return json;
}
function buildNotebookMinimal(outline: any, sections: any[]) {
  const cells: any[] = [];
  // Credit cell
  cells.push({ cell_type: 'markdown', metadata: {}, source: ['---\n', '**Remix Note**: This ELI5 version was created with the Applied Learning AI Notebooks (ALAIN) Project on 09.14.2025.\\n', 'Created by [Daniel Green](https://www.linkedin.com/in/danielpgreen).\\n', '---\n\n'] });
  // Environment cell
  cells.push({ cell_type: 'code', metadata: {}, source: ['# Environment Detection\n', "import sys\n", "IN_COLAB = 'google.colab' in sys.modules\n", "print(f'Environment: {\"Colab\" if IN_COLAB else \"Local\"}')\n"] });
  // Title/Overview
  const title = outline?.title || 'Beginner Guide';
  const overview = outline?.overview || '';
  cells.push({ cell_type: 'markdown', metadata: {}, source: [`# ${title}\n\n${overview}\n`] });
  // Objectives
  if (Array.isArray(outline?.objectives)) {
    const items = outline.objectives.map((o: string) => `- ${o}\n`);
    cells.push({ cell_type: 'markdown', metadata: {}, source: ['## Learning Objectives\n\n', ...items] });
  }
  // Sections
  for (const s of sections) {
    for (const c of (Array.isArray(s?.content) ? s.content : [])) {
      if (c.cell_type === 'code') cells.push({ cell_type: 'code', metadata: {}, source: [ensureNL(String(c.source || ''))], execution_count: null, outputs: [] });
      else cells.push({ cell_type: 'markdown', metadata: {}, source: [ensureNL(String(c.source || ''))] });
    }
  }
  // Summary
  if (outline?.summary) cells.push({ cell_type: 'markdown', metadata: {}, source: [`## Summary\n\n${outline.summary}\n`] });
  // Troubleshooting
  cells.push({ cell_type: 'markdown', metadata: {}, source: ['## 🔧 Troubleshooting\n\n- If installs fail, restart runtime and retry.\n- Keep prompts short; add details gradually.\n'] });
  return {
    cells,
    metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }, language_info: { name: 'python', version: '3' }, remix: true },
    nbformat: 4, nbformat_minor: 4
  };
}
function ensureNL(s: string) { return s.endsWith('\n') ? s : s + '\n'; }
