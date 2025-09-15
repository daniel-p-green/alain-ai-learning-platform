import { NextResponse } from 'next/server';
import { putNotebook, getNotebook, type NotebookMeta } from '@/lib/notebookStore';
import { parseGhId, fetchPublicNotebook } from '@/lib/githubRaw';

export const runtime = 'nodejs';

type RemixOptions = {
  objectives?: boolean;
  mcqs?: boolean;
  tryIt?: boolean;
  tips?: boolean;
  takeaways?: boolean;
};

function md(text: string) {
  return { cell_type: 'markdown', metadata: {}, source: Array.isArray(text) ? text : [String(text)] } as any;
}

function isMarkdownCell(c: any) { return c && c.cell_type === 'markdown'; }
function isCodeCell(c: any) { return c && c.cell_type === 'code'; }

function extractHeadings(cells: any[]): string[] {
  const out: string[] = [];
  for (const c of cells) {
    if (!isMarkdownCell(c)) continue;
    const src = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
    const lines = src.split(/\r?\n/);
    for (const line of lines) {
      const m = /^(#{1,3})\s+(.+)/.exec(line.trim());
      if (m) out.push(m[2].trim());
      if (out.length >= 6) break;
    }
    if (out.length >= 6) break;
  }
  return out;
}

function buildObjectives(cells: any[]): any {
  const heads = extractHeadings(cells);
  const items = heads.slice(0, 4).map(h => `- Understand: ${h}`);
  if (items.length === 0) items.push('- Run the examples and interpret results', '- Fix common errors confidently');
  const text = ['## Learning Objectives\n', '', ...items.map(i => i + '\n')];
  return md(text);
}

function buildMCQBlock(topic: string, idx: number): any {
  const q = `### Knowledge Check ${idx + 1}\n\n` +
    `Which statement best describes ${topic}?\n\n` +
    `- [ ] An unrelated concept\n` +
    `- [x] A key idea introduced in this section\n` +
    `- [ ] An implementation detail only\n` +
    `\n<details><summary>Explanation</summary>\nThis question reinforces the main idea from the preceding cell.\n</details>\n`;
  return md(q);
}

function buildTryItCell(): any {
  const txt = `### 🔧 Try It Yourself\n\n` +
    `- Modify the parameters above (e.g., temperature, max tokens).\n` +
    `- Change the prompt and predict how the output will change.\n` +
    `- Write a short note on what you observed.`;
  return md(txt);
}

function buildTipsCell(): any {
  const txt = `### 💡 Pro Tips\n\n` +
    `- Keep prompts concise, then iterate with specifics.\n` +
    `- Log request parameters alongside outputs.\n` +
    `- Add guards for API/network errors and timeouts.`;
  return md(txt);
}

function buildTakeaways(): any {
  const txt = `## Key Takeaways\n\n` +
    `- You can run the core workflow end-to-end.\n` +
    `- Small parameter changes can meaningfully change results.\n` +
    `- Error handling improves reliability and debuggability.`;
  return md(txt);
}

function applyTransforms(nb: any, opts: RemixOptions): any {
  const cells = Array.isArray(nb?.cells) ? nb.cells.map((c: any) => ({ ...c })) : [];
  const out: any[] = [];
  const headings = extractHeadings(cells);
  const firstTitle = headings[0] || (nb?.metadata?.title || 'Notebook');
  // Objectives at top
  if (opts.objectives) {
    out.push(buildObjectives(cells));
  }
  let mcqCount = 0;
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    out.push(c);
    if (opts.mcqs && isCodeCell(c) && mcqCount < 3) {
      const topic = headings[mcqCount] || firstTitle;
      out.push(buildMCQBlock(topic, mcqCount));
      mcqCount++;
    }
    if (opts.tryIt && isCodeCell(c) && Math.random() < 0.12) {
      out.push(buildTryItCell());
    }
  }
  if (opts.tips) out.push(buildTipsCell());
  if (opts.takeaways) out.push(buildTakeaways());
  const remixed = {
    ...nb,
    cells: out,
    metadata: { ...(nb?.metadata || {}), title: `${(nb?.metadata?.title || firstTitle)} (ALAIN Remix)` },
  };
  return remixed;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = String((body as any).id || '').trim();
    const options: RemixOptions = (body as any).options || { objectives: true, mcqs: true, takeaways: true };
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

    // Load source notebook
    let nb: any | null = null;
    let title = 'Notebook';
    const mem = getNotebook(id);
    let sourceOrg: string | undefined = undefined;
    if (mem) {
      nb = mem.nb;
      title = mem.meta?.title || title;
    } else {
      const gh = parseGhId(id);
      if (gh) {
        const got = await fetchPublicNotebook(gh);
        nb = got.nb; title = got.meta.title;
        sourceOrg = gh.owner;
      }
    }
    if (!nb) return NextResponse.json({ error: 'not_found' }, { status: 404 });

    const transformed = applyTransforms(nb, options);
    const newId = 'remix-' + Math.random().toString(36).slice(2, 10);
    const meta: NotebookMeta = {
      id: newId,
      title: transformed?.metadata?.title || `${title} (ALAIN Remix)`,
      sourceType: 'user',
      sourceOrg,
      tags: ['remix'],
      remixOfId: id,
      createdAt: new Date().toISOString(),
    } as any;
    putNotebook({ meta, nb: transformed });
    return NextResponse.json({ ok: true, id: newId, meta });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'remix failed' }, { status: 500 });
  }
}
