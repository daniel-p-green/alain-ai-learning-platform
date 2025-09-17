export const metadata = {
  title: 'ALAIN · Notebooks',
  description: 'Browse generated manuals with filters; open featured notebooks.',
};

async function fetchCatalog(qs: URLSearchParams) {
  const u = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/catalog/notebooks/public`);
  qs.forEach((v, k) => u.searchParams.set(k, v));
  const res = await fetch(u.toString(), { cache: 'no-store' });
  if (!res.ok) return { items: [] } as any;
  return await res.json();
}

export default async function NotebooksPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const qs = new URLSearchParams();
  if (searchParams?.model) qs.set('model', searchParams.model);
  if (searchParams?.provider) qs.set('provider', searchParams.provider);
  if (searchParams?.difficulty) qs.set('difficulty', searchParams.difficulty);
  if (searchParams?.tag) qs.set('tag', searchParams.tag);
  qs.set('limit', String(Math.max(1, Math.min(50, Number(searchParams?.limit || 20)))));
  const data = await fetchCatalog(qs);
  const items: any[] = Array.isArray(data?.items) ? data.items : [];
  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4 text-ink-900">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notebooks</h1>
        <a className="inline-flex items-center h-10 px-4 rounded-alain-lg border border-ink-100 bg-paper-0" href="/notebooks/featured">Featured</a>
      </div>
      <form className="grid gap-4 sm:grid-cols-4" method="get" action="/notebooks">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-model" className="text-xs font-medium text-ink-600">Model ID</label>
          <input id="filter-model" name="model" placeholder="e.g. gpt-oss-20b" defaultValue={searchParams?.model || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white" />
          <span className="text-xs text-ink-500">Leave blank to include every model.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-provider" className="text-xs font-medium text-ink-600">Provider</label>
          <select id="filter-provider" name="provider" defaultValue={searchParams?.provider || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white">
            <option value="">Any provider</option>
            <option value="poe">Poe (hosted cloud)</option>
            <option value="openai-compatible">OpenAI-compatible / local</option>
            <option value="lmstudio">LM Studio</option>
            <option value="ollama">Ollama</option>
          </select>
          <span className="text-xs text-ink-500">Match the runtime you used to generate the notebook.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-difficulty" className="text-xs font-medium text-ink-600">Difficulty</label>
          <select id="filter-difficulty" name="difficulty" defaultValue={searchParams?.difficulty || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white">
            <option value="">Any difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <span className="text-xs text-ink-500">Filter by target learner level.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-tag" className="text-xs font-medium text-ink-600">Tag</label>
          <input id="filter-tag" name="tag" placeholder="e.g. vision" defaultValue={searchParams?.tag || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white" />
          <span className="text-xs text-ink-500">Matches notebook metadata tags.</span>
        </div>
        <div className="sm:col-span-4 flex gap-2">
          <button className="h-10 px-4 rounded-alain-lg bg-ink-900 text-white" type="submit">Apply Filters</button>
          <a className="h-10 px-4 rounded-alain-lg border border-ink-100 bg-paper-0 inline-flex items-center" href="/notebooks">Reset</a>
        </div>
      </form>
      <ul className="space-y-3">
        {items.map((it) => (
          <li key={it.id || it.file_path} className="rounded border border-ink-100 p-4 bg-white/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{it.model} · {it.provider} · <span className="uppercase">{it.difficulty}</span></div>
                <div className="text-xs text-ink-600 break-all">{it.file_path}</div>
                {Array.isArray(it.tags) && it.tags.length > 0 && (
                  <div className="mt-1 text-xs text-ink-700">Tags: {it.tags.join(', ')}</div>
                )}
              </div>
              <div>
                {it.file_path && (
                  <a className="inline-flex items-center h-9 px-3 rounded bg-ink-200 text-ink-900 text-sm" href={`/api/files/download?path=${encodeURIComponent(it.file_path)}`}>Download</a>
                )}
              </div>
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-ink-700">No notebooks found. Adjust filters.</li>
        )}
      </ul>
    </div>
  );
}
