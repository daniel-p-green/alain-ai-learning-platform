// Lightweight preview that mirrors the core notebook structure without running code.
const notebookCells = [
  {
    kind: 'markdown' as const,
    label: 'Markdown cell',
    title: 'Step 1 · Capture the brief',
    body: [
      'Paste a model card or spec. ALAIN extracts guardrails, objectives, and constraints into structured JSON so every downstream stage stays aligned.',
      'Editors can pause here, adjust the outline, and replay the remaining stages with a single command.',
    ],
  },
  {
    kind: 'markdown' as const,
    label: 'Checklist',
    list: [
      'Install requirements with `%pip install -r requirements.txt`.',
      'Set `POE_API_KEY` or point `OPENAI_BASE_URL` to your compatible endpoint.',
      'Run the smoke test cell before diving into experiments.',
    ],
  },
  {
    kind: 'code' as const,
    label: 'Code cell',
    title: 'Teacher smoke test',
    code: `from alain_kit.runtime import client
client.health_check(model="gpt-oss-20b")
outline, sections = client.generate_notebook(ref="TheBloke/gpt-oss-20b")
print(f"Outline steps: {len(outline['steps'])}")`,
  },
  {
    kind: 'output' as const,
    label: 'Output',
    list: [
      '✓ Outline schema repaired (2 retries)',
      '✓ 6 sections generated · Markdown 58% / Code 42%',
      '✓ Colab checks passed · Runtime estimate 6 min',
    ],
  },
];

const runSummary = [
  { label: 'Runtime', value: '6 min 42 s' },
  { label: 'Teacher', value: 'Poe · gpt-oss-20b' },
  { label: 'Validators', value: '11 checks · 0 blockers' },
  { label: 'Artifacts', value: '.ipynb, validation.md, metrics.json' },
];

export default function HomeNotebookPreview() {
  return (
    <figure className="rounded-[28px] border border-ink-100 bg-white shadow-card">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <div className="border-b border-ink-100 lg:border-b-0 lg:border-r lg:border-ink-100/70">
          <header className="flex items-center justify-between gap-4 border-b border-ink-100 bg-paper-50 px-6 py-4">
            <div className="flex items-center gap-3 text-sm font-semibold text-ink-700">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              </span>
              ALAIN · Sample Notebook
            </div>
            <span className="text-xs font-semibold uppercase tracking-[0.24em] text-alain-blue/80">Live preview</span>
          </header>
          <div className="space-y-5 bg-paper-50 px-6 py-8">
            {notebookCells.map((cell) => {
              if (cell.kind === 'markdown') {
                return (
                  <article key={cell.label} className="rounded-2xl border border-ink-100 bg-white">
                    <div className="border-b border-ink-100/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink-600">
                      {cell.label}
                    </div>
                    <div className="space-y-3 px-5 py-4 text-sm leading-6 text-ink-700">
                      {cell.title && <h3 className="text-[15px] font-semibold text-ink-900">{cell.title}</h3>}
                      {cell.body?.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                      {cell.list && (
                        <ul className="list-disc space-y-1 pl-5">
                          {cell.list.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                );
              }

              if (cell.kind === 'code') {
                return (
                  <article
                    key={cell.label}
                    className="overflow-hidden rounded-2xl border border-ink-900/50 bg-[#0B1120] text-ink-100 shadow-alain-sm"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/80">
                      <span>{cell.label}</span>
                      <span>Python</span>
                    </div>
                    <div className="space-y-3 px-5 py-4">
                      {cell.title && <h3 className="text-sm font-semibold text-white">{cell.title}</h3>}
                      <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                        <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-emerald-100">
                          <code>{cell.code}</code>
                        </pre>
                      </div>
                    </div>
                  </article>
                );
              }

              return (
                <article key={cell.label} className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-sm text-emerald-900">
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600">{cell.label}</div>
                  <ul className="mt-3 space-y-2">
                    {cell.list?.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
        <aside className="flex flex-col gap-6 bg-white px-6 py-8 lg:px-8">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-alain-blue/80">Run summary</div>
            <h3 className="font-display text-[26px] leading-[1.1] text-ink-900">Everything you need before handoff</h3>
            <p className="text-sm text-ink-600">
              Every generation ships with guardrails, retries, and audit trails. Editors can replay any step or export artifacts straight to Colab, Jupyter, or CI.
            </p>
          </div>
          <dl className="grid gap-4 text-sm text-ink-700">
            {runSummary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-ink-100 bg-white p-4 shadow-alain-sm">
                <dt className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-600">{item.label}</dt>
                <dd className="mt-1 font-medium text-ink-900">{item.value}</dd>
              </div>
            ))}
          </dl>
          <div className="rounded-2xl border border-ink-100 bg-paper-0 p-5 shadow-alain-sm">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-600">Launch checklist</div>
            <ul className="mt-3 space-y-2 text-sm text-ink-700">
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-alain-blue" />
                Notebook metadata embeds provider, objectives, and validators for analytics.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-alain-blue" />
                Validation markdown highlights fixes and any manual follow-ups.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 inline-flex h-1.5 w-1.5 flex-none rounded-full bg-alain-blue" />
                Metrics JSON feeds dashboards for readability, retries, and export events.
              </li>
            </ul>
          </div>
        </aside>
      </div>
      <figcaption className="sr-only">Sample cells and summary from an ALAIN generated notebook.</figcaption>
    </figure>
  );
}
