const MAX_TOKENS = Number(process.env.NOTEBOOK_MAX_TOKENS || '400');

export function buildNotebookFromLesson(lesson: any) {
  const cells: any[] = [];
  const meta = lesson || {};
  const title = meta.title || 'Lesson';
  const desc = meta.description || '';
  cells.push({ cell_type: 'markdown', metadata: {}, source: [`# ${title}\n`, `\n`, `${desc}\n`] });
  cells.push({ cell_type: 'code', metadata: {}, source: ["!pip -q install openai>=1.34.0\n"], outputs: [], execution_count: null });
  // Provider env and client setup
  cells.push({ cell_type: 'code', metadata: {}, source: [
    "from openai import OpenAI\n",
    "import os\n",
    "base = os.environ.get('OPENAI_BASE_URL') or 'http://localhost:11434/v1'\n",
    "key = os.environ.get('OPENAI_API_KEY') or 'ollama'\n",
    "client = OpenAI(base_url=base, api_key=key)\n",
  ], outputs: [], execution_count: null });
  // Pre-flight connectivity check
  cells.push({ cell_type: 'code', metadata: {}, source: [
    "# Pre-flight: attempt a tiny call\n",
    "try:\n",
    "  _ = client.models.list()\n",
    "  print('✅ Connected to provider.')\n",
    "except Exception as e:\n",
    "  print('⚠️ Pre-flight failed:', e)\n",
  ], outputs: [], execution_count: null });
  const steps = Array.isArray(meta.steps) ? meta.steps : [];
  let order = 1;
  const assessments = Array.isArray((lesson as any).assessments) ? (lesson as any).assessments : [];
  const listAssessments = (order: number) => assessments.filter((a: any) => a.step_order === order);

  for (const s of steps) {
    cells.push({ cell_type: 'markdown', metadata: {}, source: [`## Step ${order}: ${s.title || ''}\n`, `\n`, `${s.content || ''}\n`] });
    const prompt = (s.code_template || '').toString();
    const t = s?.model_params?.temperature ?? 0.7;
    cells.push({ cell_type: 'code', metadata: {}, source: [
      `PROMPT = """\n${prompt}\n"""\n`,
      `resp = client.chat.completions.create(model=${JSON.stringify(meta.model || '')}, messages=[{"role":"user","content":PROMPT}], temperature=${t}, max_tokens=${MAX_TOKENS})\n`,
      "print(resp.choices[0].message.content)\n",
    ], outputs: [], execution_count: null });
    // Add assessments if available (interactive only to encourage active participation)
    const qs = listAssessments(order);
    for (const a of qs) {
      // Brief instruction markdown encouraging interaction
      cells.push({ cell_type: 'markdown', metadata: {}, source: [
        `> Assessment for Step ${order}: Select an answer in the widget below.`,
        `\n`,
        `> Tip: Don't use Run All here; interact with the quiz to check understanding.\n`,
      ]});

      const widget = [
        `# Interactive quiz for Step ${order}\n`,
        `import ipywidgets as widgets\n`,
        `from IPython.display import display, Markdown\n`,
        `q = ${JSON.stringify(a.question || '')}\n`,
        `opts = ${JSON.stringify(a.options || [])}\n`,
        `correct = ${Number(a.correct_index ?? 0)}\n`,
        `rb = widgets.RadioButtons(options=[(o, i) for i, o in enumerate(opts)], description='', disabled=False)\n`,
        `btn = widgets.Button(description='Submit Answer')\n`,
        `out = widgets.Output()\n`,
        `def on_click(b):\n`,
        `  with out:\n`,
        `    out.clear_output()\n`,
        `    sel = rb.value if hasattr(rb, 'value') else 0\n`,
        `    if sel == correct:\n`,
        `      display(Markdown('**Correct!**'${a.explanation ? ` + ' - ' + ${JSON.stringify(a.explanation)}` : ''}))\n`,
        `    else:\n`,
        `      display(Markdown('Incorrect, please try again.'))\n`,
        `btn.on_click(on_click)\n`,
        `display(Markdown(f"### {q}"))\n`,
        `display(rb, btn, out)\n`,
      ];
      cells.push({ cell_type: 'code', metadata: {}, source: widget, outputs: [], execution_count: null });
    }

    order += 1;
  }
  return {
    cells,
    metadata: { kernelspec: { name: 'python3', language: 'python', display_name: 'Python 3' }, language_info: { name: 'python' } },
    nbformat: 4,
    nbformat_minor: 5,
  };
}
