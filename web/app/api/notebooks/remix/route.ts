import { NextResponse } from 'next/server';
import { putNotebook, getNotebook, type NotebookMeta } from '@/lib/notebookStore';
import { parseGhId, fetchPublicNotebook } from '@/lib/githubRaw';
import { poeProvider, openAIProvider, type Provider as WebProvider } from '@/lib/providers';

export const runtime = 'nodejs';

type RemixOptions = {
  objectives?: boolean;
  mcqs?: boolean;
  tryIt?: boolean;
  tips?: boolean;
  takeaways?: boolean;
  // Prototype: translate markdown content to target difficulty
  translate?: boolean;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  provider?: 'poe' | 'openai-compatible';
  model?: string;
};

function md(text: string | string[]) {
  return { cell_type: 'markdown', metadata: {}, source: Array.isArray(text) ? text : [String(text)] } as any;
}

function code(lines: string | string[]) {
  const src = Array.isArray(lines) ? lines : [String(lines)];
  return { cell_type: 'code', metadata: {}, source: src, execution_count: null, outputs: [] } as any;
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

// Install ipywidgets (Colab/local) and define a helper for interactive MCQs
function buildIpywidgetsInstaller(): any {
  return code([
    "# Ensure ipywidgets is available for interactive questions\n",
    "try:\n",
    "    import ipywidgets  # type: ignore\n",
    "    print('ipywidgets available')\n",
    "except Exception:\n",
    "    import sys, subprocess\n",
    "    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'ipywidgets>=8.0.0'])\n"
  ]);
}

function buildMcqHelper(): any {
  return code([
    "# MCQ helper (ipywidgets)\n",
    "import ipywidgets as widgets\n",
    "from IPython.display import display, Markdown\n\n",
    "def render_mcq(question, options, correct_index, explanation):\n",
    "    rb = widgets.RadioButtons(options=[(f'{chr(65+i)}. '+opt, i) for i,opt in enumerate(options)], description='')\n",
    "    grade_btn = widgets.Button(description='Grade', button_style='primary')\n",
    "    feedback = widgets.HTML(value='')\n",
    "    def on_grade(_):\n",
    "        sel = rb.value\n",
    "        if sel is None:\n",
    "            feedback.value = '<p>⚠️ Please select an option.</p>'\n",
    "            return\n",
    "        if sel == correct_index:\n",
    "            feedback.value = '<p>✅ Correct!</p>'\n",
    "        else:\n",
    "            feedback.value = f'<p>❌ Incorrect. Correct answer is {chr(65+correct_index)}.</p>'\n",
    "        feedback.value += f'<div><em>Explanation:</em> {explanation}</div>'\n",
    "    grade_btn.on_click(on_grade)\n",
    "    display(Markdown('### '+question))\n",
    "    display(rb)\n",
    "    display(grade_btn)\n",
    "    display(feedback)\n"
  ]);
}

function buildInteractiveMCQ(topic: string, idx: number): any {
  const question = `In "${topic}", which prompt style is best for beginners?`;
  const options = [
    'A clear, step-by-step request with the goal stated',
    'A vague request without details',
    'An unrelated instruction',
    'A long wall of text with no structure'
  ];
  const correctIndex = 0;
  const explanation = 'Clear, step-by-step prompts help the model follow your intent.';
  const call = `render_mcq(${JSON.stringify(question)}, ${JSON.stringify(options)}, ${correctIndex}, ${JSON.stringify(explanation)})\n`;
  return code([call]);
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

async function applyTransforms(nb: any, opts: RemixOptions): Promise<any> {
  const cells = Array.isArray(nb?.cells) ? nb.cells.map((c: any) => ({ ...c })) : [];
  const out: any[] = [];
  const headings = extractHeadings(cells);
  const firstTitle = headings[0] || (nb?.metadata?.title || 'Notebook');
  // Attribution + ELI5 quick intro
  out.push(md([
    '<!--\n',
    'Remixed with the Applied Learning AI Notebooks (ALAIN) Project\n',
    'Date: 09.14.2025\n',
    'Created by: Daniel Green — https://linkedin.com/in/danielpgreen\n',
    '-->\n'
  ]));
  out.push(md([
    `# ${firstTitle} (ALAIN Remix — ELI5)\n\n`,
    'This version uses plain language and step-by-step guidance for newcomers.\n'
  ]));
  // Objectives at top
  if (opts.objectives) {
    out.push(buildObjectives(cells));
  }
  // MCQ support cells (install + helper)
  let mcqPrimed = false;
  let mcqCount = 0;
  // Optional translator
  const translator = await buildTranslator(opts);
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    // If translating, rewrite markdown cells only
    if (translator && isMarkdownCell(c)) {
      try {
        const src = Array.isArray(c.source) ? c.source.join('') : String(c.source || '');
        const rewritten = await translator(src);
        const lines = (rewritten || src).split(/\n/).map(l => l.endsWith('\n') ? l : l + '\n');
        out.push({ ...c, source: lines });
      } catch {
        out.push(c);
      }
    } else {
      out.push(c);
    }
    // Insert interactive MCQs after prominent markdown sections
    if (opts.mcqs && isMarkdownCell(c) && mcqCount < 3) {
      const topic = headings[mcqCount] || firstTitle;
      if (!mcqPrimed) { out.push(buildIpywidgetsInstaller()); out.push(buildMcqHelper()); mcqPrimed = true; }
      out.push(buildInteractiveMCQ(topic, mcqCount));
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
    metadata: {
      ...(nb?.metadata || {}),
      title: `${(nb?.metadata?.title || firstTitle)} (ALAIN Remix — ELI5)`,
      remixed_with: 'ALAIN',
      remixed_by: 'Daniel Green',
      remixed_on: '2025-09-14',
      remixed_by_link: 'https://linkedin.com/in/danielpgreen'
    },
  };
  return remixed;
}

async function buildTranslator(opts: RemixOptions): Promise<((md: string) => Promise<string>) | null> {
  if (!opts?.translate) return null;
  // Pick provider based on env or explicit selection
  const haveOpenAI = !!(process.env.OPENAI_BASE_URL && process.env.OPENAI_API_KEY);
  const havePoe = !!process.env.POE_API_KEY;
  const providerId: 'openai-compatible' | 'poe' | null = (opts.provider as any) || (haveOpenAI ? 'openai-compatible' : havePoe ? 'poe' : null);
  if (!providerId) return null;
  const provider: WebProvider = providerId === 'openai-compatible' ? openAIProvider : poeProvider;
  const model = opts.model || (providerId === 'openai-compatible' ? 'gpt-4o' : 'gpt-4o-mini');
  const difficulty = opts.difficulty || 'beginner';
  const system = [
    `You are ALAIN-Translator. Rewrite the following Markdown for a ${difficulty} learner.`,
    `Rules: keep all facts, links, and headings; preserve code fences verbatim; simplify wording; define jargon briefly;`,
    `add short analogies if helpful; do not add new claims; output only Markdown text (no backticks or JSON).`
  ].join(' ');
  return async (md: string) => {
    const content = await provider.execute({
      provider: providerId,
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: md }
      ],
      temperature: 0.2,
      max_tokens: 800
    });
    return (content || '').trim();
  };
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

    const transformed = await applyTransforms(nb, options);
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
