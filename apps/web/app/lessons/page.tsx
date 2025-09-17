import { appBaseUrl } from '@/lib/requestBase';

export const metadata = {
  title: 'ALAIN · Lessons',
  description: 'Browse generated lessons with filters',
};

async function fetchCatalog(qs: URLSearchParams) {
  const search = qs.toString();
  const base = appBaseUrl();
  const path = `/api/catalog/lessons/public${search ? `?${search}` : ''}`;
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) return { items: [] } as any;
  return await res.json();
}

export default async function LessonsPage({ searchParams }: { searchParams?: Record<string, string> }) {
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
        <h1 className="text-2xl font-semibold">Lessons</h1>
      </div>
      <form className="grid gap-4 sm:grid-cols-4" method="get" action="/lessons">
        <div className="flex flex-col gap-1">
          <label htmlFor="lesson-filter-model" className="text-xs font-medium text-ink-600">Model ID</label>
          <input id="lesson-filter-model" name="model" placeholder="e.g. gpt-oss-20b" defaultValue={searchParams?.model || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white" />
          <span className="text-xs text-ink-500">Filter to a specific model or leave blank.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lesson-filter-provider" className="text-xs font-medium text-ink-600">Provider</label>
          <select id="lesson-filter-provider" name="provider" defaultValue={searchParams?.provider || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white">
            <option value="">Any provider</option>
            <option value="poe">Poe (hosted cloud)</option>
            <option value="openai-compatible">OpenAI-compatible / local</option>
            <option value="lmstudio">LM Studio</option>
            <option value="ollama">Ollama</option>
          </select>
          <span className="text-xs text-ink-500">Choose the runtime the lesson targets.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lesson-filter-difficulty" className="text-xs font-medium text-ink-600">Difficulty</label>
          <select id="lesson-filter-difficulty" name="difficulty" defaultValue={searchParams?.difficulty || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white">
            <option value="">Any difficulty</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <span className="text-xs text-ink-500">Match the learner level you need.</span>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="lesson-filter-tag" className="text-xs font-medium text-ink-600">Tag</label>
          <input id="lesson-filter-tag" name="tag" placeholder="e.g. rlhf" defaultValue={searchParams?.tag || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white" />
          <span className="text-xs text-ink-500">Matches lesson metadata tags.</span>
        </div>
        <div className="sm:col-span-4 flex gap-2">
          <button className="h-10 px-4 rounded-alain-lg bg-ink-900 text-white" type="submit">Apply Filters</button>
          <a className="h-10 px-4 rounded-alain-lg border border-ink-100 bg-paper-0 inline-flex items-center" href="/lessons">Reset</a>
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
            </div>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-ink-700">No lessons found. Adjust filters.</li>
        )}
      </ul>
    </div>
  );
}
