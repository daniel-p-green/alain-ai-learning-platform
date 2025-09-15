#!/usr/bin/env node
/**
 * Remix the OpenAI Cookbook GPT-5 Prompting Guide notebook into an ELI5 version
 * with ALAIN attribution and beginner-friendly scaffolding, plus interactive MCQs.
 */

const fs = require('fs');
const path = require('path');

async function main() {
  const srcUrl = 'https://raw.githubusercontent.com/openai/openai-cookbook/main/examples/gpt-5/gpt-5_prompting_guide.ipynb';
  const outDir = path.join(__dirname, '..', 'content', 'notebooks', 'remixes', '2025-09-14');
  const outFile = path.join(outDir, 'gpt-5_prompting_guide_eli5_alain_remix.ipynb');

  console.log('Fetching source notebook…');
  const res = await fetch(srcUrl);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching notebook`);
  const text = await res.text();
  let nb;
  try { nb = JSON.parse(text); } catch { throw new Error('Invalid JSON in source notebook'); }

  const isMd = (c) => c && c.cell_type === 'markdown';
  const srcToString = (src) => Array.isArray(src) ? src.join('') : String(src || '');
  const mdCell = (lines) => {
    const arr = Array.isArray(lines) ? lines : [String(lines)];
    const norm = arr.map(s => (s.endsWith('\n') ? s : s + '\n'));
    return { cell_type: 'markdown', metadata: {}, source: norm };
  };
  const code = (lines) => {
    const arr = Array.isArray(lines) ? lines : [String(lines)];
    return { cell_type: 'code', metadata: {}, source: arr, execution_count: null, outputs: [] };
  };

  const extractHeadings = (cells) => {
    const out = [];
    for (const c of cells) {
      if (!isMd(c)) continue;
      const lines = srcToString(c.source).split(/\r?\n/);
      for (const line of lines) {
        const m = /^(#{1,3})\s+(.+)/.exec(line.trim());
        if (m) out.push(m[2].trim());
        if (out.length >= 8) break;
      }
      if (out.length >= 8) break;
    }
    return out;
  };

  const heads = extractHeadings(Array.isArray(nb.cells) ? nb.cells : []);
  const baseTitle = nb?.metadata?.title || heads[0] || 'GPT-5 Prompting Guide';

  const attribution = [
    '<!--\n',
    'Remixed with the Applied Learning AI Notebooks (ALAIN) Project\n',
    'Date: 09.14.2025\n',
    'Created by: Daniel Green — https://linkedin.com/in/danielpgreen\n',
    '-->\n'
  ];

  const titleCell = mdCell([
    `# ${baseTitle} — ELI5 Remix\n\n`,
    'This version explains the ideas like you are brand-new to AI and programming. No coding experience is required — we focus on simple explanations, plain language, and step-by-step guidance.\n\n',
  ]);
  const eli5Overview = mdCell([
    '## ELI5 Overview\n\n',
    "Imagine you're teaching a super helpful robot to do tasks. 'Prompting' is how you talk to the robot so it does what you want. In this guide, you'll learn simple ways to ask clearly, give good examples, and check the robot's work — all in beginner-friendly terms.\n\n",
    '- What is a prompt? A short message telling the AI what to do.\n',
    '- Why do prompts matter? Clear prompts → better answers.\n',
    '- What will you practice? Asking clearly, giving examples, and checking results.\n'
  ]);

  const objectivesItems = (heads.length ? heads.slice(0, 4) : [
    'Explain what prompting is',
    'Use simple structures to ask clearly',
    'Give examples to guide the AI',
    'Check and refine the AI’s answers',
  ]).map(h => `- Understand: ${h}\n`);
  const objectivesCell = mdCell(['## Learning Objectives\n\n', ...objectivesItems]);

  const buildIpywidgetsInstaller = () => code([
    "# Ensure ipywidgets is available for interactive questions\n",
    "try:\n",
    "    import ipywidgets  # type: ignore\n",
    "    print('ipywidgets available')\n",
    "except Exception:\n",
    "    import sys, subprocess\n",
    "    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'ipywidgets>=8.0.0'])\n"
  ]);
  const buildMcqHelper = () => code([
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
  const buildInteractiveMCQ = (topic, idx) => {
    const question = `In \"${topic}\", which prompt style is best for beginners?`;
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
  };
  const buildTryIt = () => mdCell([
    '### 🔧 Try It Yourself\n\n',
    '- Rephrase one instruction to be shorter and clearer.\n',
    '- Add one example to show the AI the right format.\n',
    '- Predict how the change will affect the result.\n'
  ]);
  const buildTips = () => mdCell([
    '### 💡 Pro Tips\n\n',
    '- Start simple, then add details.\n',
    '- Use bullet points for multi-step tasks.\n',
    '- Give 1–2 examples to anchor the style.\n',
    '- Ask the AI to explain its answer in plain words.\n'
  ]);
  const buildTakeaways = () => mdCell([
    '## Key Takeaways\n\n',
    '- Clear prompts → clearer answers.\n',
    '- Examples reduce guesswork.\n',
    '- Small changes can improve results a lot.\n',
    '- Always review and refine.\n'
  ]);
  const buildPlainWords = (topic) => mdCell([
    `> In plain words: This section explains ${topic} with simple, step-by-step guidance so beginners can follow along.\n`
  ]);

  const origCells = Array.isArray(nb.cells) ? nb.cells : [];
  const outCells = [];
  outCells.push(mdCell(attribution));
  outCells.push(titleCell);
  outCells.push(eli5Overview);
  outCells.push(objectivesCell);

  let mcqCount = 0;
  let mcqPrimed = false;
  for (let i = 0; i < origCells.length; i++) {
    const c = origCells[i];
    outCells.push(c);
    // After major headings, add a plain-words callout
    if (isMd(c)) {
      const firstLine = srcToString(c.source).split(/\r?\n/).find(Boolean) || '';
      const hm = /^(#{1,3})\s+(.+)/.exec(firstLine.trim());
      if (hm) outCells.push(buildPlainWords(hm[2].trim()));
    }
    if (isMd(c) && mcqCount < 3) {
      const topic = heads[mcqCount] || baseTitle;
      if (!mcqPrimed) { outCells.push(buildIpywidgetsInstaller()); outCells.push(buildMcqHelper()); mcqPrimed = true; }
      outCells.push(buildInteractiveMCQ(topic, mcqCount));
      if (mcqCount === 1) outCells.push(buildTryIt());
      mcqCount++;
    }
  }
  outCells.push(buildTips());
  outCells.push(buildTakeaways());

  const remixed = {
    ...nb,
    cells: outCells,
    metadata: {
      ...(nb.metadata || {}),
      title: `${baseTitle} (ALAIN Remix — ELI5)`,
      sourceType: 'user',
      tags: Array.isArray(nb?.metadata?.tags) ? Array.from(new Set([...(nb.metadata.tags || []), 'remix', 'eli5', 'beginner', 'alain'])) : ['remix', 'eli5', 'beginner', 'alain'],
      provenance_url: srcUrl,
      remixed_with: 'ALAIN',
      remixed_by: 'Daniel Green',
      remixed_on: '2025-09-14',
      remixed_by_link: 'https://linkedin.com/in/danielpgreen'
    },
    nbformat: nb.nbformat || 4,
    nbformat_minor: nb.nbformat_minor ?? 4
  };

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(remixed, null, 2));
  console.log('Remix saved to:', outFile);
}

main().catch(err => {
  console.error(err?.message || err);
  process.exit(1);
});
