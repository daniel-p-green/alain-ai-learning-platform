export function buildNotebookFromLesson(lesson: any) {
  const cells: any[] = [];
  const meta = lesson || {};
  const title = meta.title || 'Lesson';
  const desc = meta.description || '';
  cells.push({ cell_type: 'markdown', metadata: {}, source: [`# ${title}\n`, `\n`, `${desc}\n`] });
  cells.push({ cell_type: 'code', metadata: {}, source: ["!pip -q install openai>=1.34.0\n"], outputs: [], execution_count: null });
  cells.push({ cell_type: 'code', metadata: {}, source: [
    "from openai import OpenAI\n",
    "import os\n",
    "base = os.environ.get('OPENAI_BASE_URL') or 'http://localhost:11434/v1'\n",
    "key = os.environ.get('OPENAI_API_KEY') or 'ollama'\n",
    "client = OpenAI(base_url=base, api_key=key)\n",
  ], outputs: [], execution_count: null });
  const steps = Array.isArray(meta.steps) ? meta.steps : [];
  let order = 1;
  for (const s of steps) {
    cells.push({ cell_type: 'markdown', metadata: {}, source: [`## Step ${order}: ${s.title || ''}\n`, `\n`, `${s.content || ''}\n`] });
    const prompt = (s.code_template || '').toString();
    const t = s?.model_params?.temperature ?? 0.7;
    cells.push({ cell_type: 'code', metadata: {}, source: [
      `PROMPT = """\n${prompt}\n"""\n`,
      `resp = client.chat.completions.create(model=${JSON.stringify(meta.model || '')}, messages=[{"role":"user","content":PROMPT}], temperature=${t}, max_tokens=400)\n`,
      "print(resp.choices[0].message.content)\n",
    ], outputs: [], execution_count: null });
    order += 1;
  }
  return {
    cells,
    metadata: { kernelspec: { name: 'python3', language: 'python', display_name: 'Python 3' }, language_info: { name: 'python' } },
    nbformat: 4,
    nbformat_minor: 5,
  };
}

