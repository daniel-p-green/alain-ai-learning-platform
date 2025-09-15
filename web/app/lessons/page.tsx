export const metadata = {
  title: 'ALAIN · Lessons',
  description: 'Browse generated lessons with filters',
};

async function fetchCatalog(qs: URLSearchParams) {
  const u = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/catalog/lessons/public`);
  qs.forEach((v, k) => u.searchParams.set(k, v));
  const res = await fetch(u.toString(), { cache: 'no-store' });
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
      <form className="grid gap-3 sm:grid-cols-4" method="get" action="/lessons">
        <input name="model" placeholder="model" defaultValue={searchParams?.model || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white" />
        <input name="provider" placeholder="provider" defaultValue={searchParams?.provider || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white" />
        <select name="difficulty" defaultValue={searchParams?.difficulty || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white">
          <option value="">any difficulty</option>
          <option value="beginner">beginner</option>
          <option value="intermediate">intermediate</option>
          <option value="advanced">advanced</option>
        </select>
        <input name="tag" placeholder="tag" defaultValue={searchParams?.tag || ''} className="h-10 px-3 rounded-alain-lg border border-ink-100 bg-white" />
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

