import { NextResponse } from 'next/server';
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

    // Lazy import core generators (avoid bundling in edge runtimes)
    const { OutlineGenerator } = await import('../../../../../../alain-kit/core/outline-generator');
    const { SectionGenerator } = await import('../../../../../../alain-kit/core/section-generator');
    const { NotebookBuilder } = await import('../../../../../../alain-kit/core/notebook-builder');

    const outlineGen = new OutlineGenerator({ baseUrl });
    const outline = await outlineGen.generateOutline({
      model: model,
      apiKey: 'local',
      difficulty: 'beginner',
      customPrompt: {
        title: subject,
        description: 'Beginner-friendly remix (non-developers).',
        difficulty: 'beginner',
        topics: heads,
        // @ts-ignore extra hint consumed by OutlineGenerator
        context: `Source headings: ${heads.join(' | ')}\n\nExcerpt (markdown-only):\n${excerpt}`,
        temperature: 0.1,
        maxTokens: 2000
      } as any
    });

    // Generate sections sequentially (keep it predictable for demos)
    const sectionGen = new SectionGenerator({ baseUrl });
    const sections: any[] = [];
    for (let i = 1; i <= Math.min(maxSections, outline.outline.length); i++) {
      const sec = await sectionGen.generateSection({
        outline,
        sectionNumber: i,
        previousSections: sections as any,
        modelReference: model,
        apiKey: 'local',
        customPrompt: { temperature: 0.2, maxTokens: 1200 } as any
      });
      sections.push(sec);
    }

    const builder = new NotebookBuilder();
    const built = builder.buildNotebook(outline as any, sections as any);
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

