import NotebookCard from '@/components/NotebookCard';
import { safeAuth } from '@/lib/auth';
import { appBaseUrl } from '@/lib/requestBase';
import featuredNotebooks from '@/data/featured-notebooks.json';

export const metadata = {
  title: 'ALAIN · Notebook Library',
  description: 'Browse generated manuals, filter by model, and manage publication status.',
};

export type MakerInfo = {
  name?: string;
  org_type?: string;
  homepage?: string;
  license?: string;
  repo?: string;
  responsible_use?: string[];
};

export type NotebookDirectoryItem = {
  id: number;
  file_path: string;
  model: string;
  provider: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title?: string | null;
  overview?: string | null;
  maker?: MakerInfo | null;
  quality_score?: number | null;
  colab_compatible?: boolean | null;
  section_count?: number | null;
  created_by?: string | null;
  visibility: 'private' | 'public' | 'unlisted';
  share_slug?: string | null;
  tags?: string[] | null;
  size_bytes?: number | null;
  checksum?: string | null;
  last_generated?: string | null;
};

async function fetchCatalog(qs: URLSearchParams): Promise<NotebookDirectoryItem[]> {
  const search = qs.toString();
  const base = appBaseUrl();
  const path = `/api/catalog/notebooks/public${search ? `?${search}` : ''}`;
  const res = await fetch(`${base}${path}`, { cache: 'no-store' });
  if (!res.ok) return [];
  const body = await res.json().catch(() => ({ items: [] }));
  return Array.isArray(body?.items) ? (body.items as NotebookDirectoryItem[]) : [];
}

function fallbackCatalog(): NotebookDirectoryItem[] {
  return featuredNotebooks.map((item, index) => ({
    id: -(index + 1),
    file_path: item.id,
    model: 'gpt-oss-20b',
    provider: 'github',
    difficulty: 'intermediate' as const,
    title: item.title,
    overview: item.org ? `Curated from ${item.org}` : null,
    maker: item.org ? { name: item.org, org_type: 'community' } : null,
    quality_score: null,
    colab_compatible: null,
    section_count: null,
    created_by: null,
    visibility: 'public',
    share_slug: item.id,
    tags: item.tags || [],
    size_bytes: null,
    checksum: null,
    last_generated: null,
  }));
}

export default async function NotebooksPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const qs = new URLSearchParams();
  if (searchParams?.model) qs.set('model', searchParams.model);
  if (searchParams?.provider) qs.set('provider', searchParams.provider);
  if (searchParams?.difficulty) qs.set('difficulty', searchParams.difficulty);
  if (searchParams?.tag) qs.set('tag', searchParams.tag);
  qs.set('limit', String(Math.max(1, Math.min(50, Number(searchParams?.limit || 24)))));

  const [items, auth] = await Promise.all([fetchCatalog(qs), safeAuth()]);
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const usingFallback = items.length === 0;
  const displayItems = usingFallback ? fallbackCatalog() : items;
  const sortOption = searchParams?.sort || 'featured';
  const viewMode = searchParams?.view === 'list' ? 'list' : 'grid';

  const sortedItems = sortOption === 'featured' ? displayItems : [...displayItems].sort((a, b) => {
    if (sortOption === 'newest') {
      const aTime = a.last_generated ? Date.parse(a.last_generated) : 0;
      const bTime = b.last_generated ? Date.parse(b.last_generated) : 0;
      return bTime - aTime;
    }
    if (sortOption === 'title') {
      const aTitle = (a.title || a.model || '').toLowerCase();
      const bTitle = (b.title || b.model || '').toLowerCase();
      return aTitle.localeCompare(bTitle);
    }
    if (sortOption === 'quality') {
      const aScore = typeof a.quality_score === 'number' ? a.quality_score : -1;
      const bScore = typeof b.quality_score === 'number' ? b.quality_score : -1;
      return bScore - aScore;
    }
    return 0;
  });

  const hydratedSearch = new URLSearchParams();
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value) hydratedSearch.set(key, value);
  });

  const filterEntries = [
    { key: 'model', label: 'Model', value: searchParams?.model },
    { key: 'provider', label: 'Provider', value: searchParams?.provider },
    { key: 'difficulty', label: 'Difficulty', value: searchParams?.difficulty },
    { key: 'tag', label: 'Tag', value: searchParams?.tag },
  ].filter((entry) => Boolean(entry.value));

  const viewOptions: Array<{ id: 'grid' | 'list'; label: string }> = [
    { id: 'grid', label: 'Grid' },
    { id: 'list', label: 'List' },
  ];

  function buildHref(removeKey?: string, nextValue?: string | null) {
    const params = new URLSearchParams(hydratedSearch.toString());
    if (removeKey) {
      params.delete(removeKey);
      if (nextValue) params.set(removeKey, nextValue);
    }
    const query = params.toString();
    return `/notebooks${query ? `?${query}` : ''}`;
  }

  function buildViewHref(target: 'grid' | 'list') {
    const params = new URLSearchParams(hydratedSearch.toString());
    if (target === 'grid') {
      params.delete('view');
    } else {
      params.set('view', target);
    }
    const query = params.toString();
    return `/notebooks${query ? `?${query}` : ''}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-8 text-ink-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Notebook Library</h1>
          <p className="max-w-prose text-sm text-ink-600">
            Discover curated notebooks, filter by runtime or target learner, and share the ones that resonate with your community.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <a className="inline-flex items-center rounded-alain-lg border border-alain-blue/40 px-4 py-2 text-sm font-semibold text-alain-blue transition hover:border-alain-blue hover:bg-alain-blue/10" href="/notebooks/featured">
            Featured notebooks
          </a>
          <a className="inline-flex h-10 items-center rounded-alain-lg bg-alain-blue px-4 text-sm font-semibold text-white shadow-card transition hover:bg-alain-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue/30" href="/generate">
            Generate manual
          </a>
        </div>
      </div>

      <section className="rounded-2xl border border-ink-100 bg-white/80 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-500">Filter notebooks</h2>
            <p className="text-xs text-ink-500">Combine filters to narrow the catalog or discover new ideas by toggling views.</p>
          </div>
          <div className="flex items-center gap-2">
            {viewOptions.map((option) => (
              <a
                key={option.id}
                href={buildViewHref(option.id)}
                className={`inline-flex h-9 items-center rounded-full px-4 text-xs font-semibold transition ${viewMode === option.id ? 'bg-ink-900 text-white shadow-card' : 'border border-ink-200 text-ink-600 hover:border-ink-400'}`}
              >
                {option.label}
              </a>
            ))}
          </div>
        </div>

        {filterEntries.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {filterEntries.map((entry) => (
              <a
                key={entry.key}
                href={buildHref(entry.key)}
                className="inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1 text-xs text-ink-700 transition hover:bg-ink-200"
              >
                <span className="font-medium text-ink-900">{entry.label}:</span> {entry.value}
                <span aria-hidden="true" className="text-ink-500">×</span>
              </a>
            ))}
            <a href="/notebooks" className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-alain-blue transition hover:bg-alain-blue/10">
              Clear all
            </a>
          </div>
        )}

        <form className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5" method="get" action="/notebooks">
          {viewMode === 'list' && <input type="hidden" name="view" value="list" />}
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-model" className="text-xs font-medium text-ink-600">Model ID</label>
            <input id="filter-model" name="model" placeholder="e.g. gpt-oss-20b" defaultValue={searchParams?.model || ''} className="h-10 rounded-alain-lg border border-ink-100 bg-white px-3 text-sm shadow-inner" />
            <span className="text-xs text-ink-500">Leave blank to include every model.</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-provider" className="text-xs font-medium text-ink-600">Provider</label>
            <select id="filter-provider" name="provider" defaultValue={searchParams?.provider || ''} className="h-10 rounded-alain-lg border border-ink-100 bg-white px-3 text-sm">
              <option value="">Any provider</option>
              <option value="poe">Poe (hosted cloud)</option>
              <option value="openai-compatible">OpenAI-compatible / local</option>
              <option value="lmstudio">LM Studio</option>
              <option value="ollama">Ollama</option>
            </select>
            <span className="text-xs text-ink-500">Match the runtime used to generate the notebook.</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-difficulty" className="text-xs font-medium text-ink-600">Difficulty</label>
            <select id="filter-difficulty" name="difficulty" defaultValue={searchParams?.difficulty || ''} className="h-10 rounded-alain-lg border border-ink-100 bg-white px-3 text-sm">
              <option value="">Any difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <span className="text-xs text-ink-500">Filter by target learner level.</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filter-tag" className="text-xs font-medium text-ink-600">Tag</label>
            <input id="filter-tag" name="tag" placeholder="e.g. vision" defaultValue={searchParams?.tag || ''} className="h-10 rounded-alain-lg border border-ink-100 bg-white px-3 text-sm" />
            <span className="text-xs text-ink-500">Matches notebook metadata tags.</span>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="sort" className="text-xs font-medium text-ink-600">Sort</label>
            <select id="sort" name="sort" defaultValue={sortOption} className="h-10 rounded-alain-lg border border-ink-100 bg-white px-3 text-sm">
              <option value="featured">Featured order</option>
              <option value="newest">Newest first</option>
              <option value="title">Title A → Z</option>
              <option value="quality">Highest quality</option>
            </select>
            <span className="text-xs text-ink-500">Choose how notebooks are arranged.</span>
          </div>
          <div className="flex flex-col gap-2 md:col-span-2 lg:col-span-3 xl:col-span-5 md:flex-row md:items-end">
            <button className="inline-flex h-10 items-center justify-center rounded-alain-lg bg-ink-900 px-4 text-sm font-semibold text-white transition hover:bg-ink-900/90" type="submit">Apply filters</button>
            <a className="inline-flex h-10 items-center justify-center rounded-alain-lg border border-ink-100 bg-paper-0 px-4 text-sm font-semibold text-ink-700 transition hover:border-ink-200" href="/notebooks">Reset</a>
          </div>
        </form>
      </section>

      {displayItems.length === 0 ? (
        <p className="text-ink-700">No notebooks found. Adjust filters.</p>
      ) : (
        <div className={viewMode === 'list' ? 'grid gap-3' : 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
          {sortedItems.map((item) => (
            <NotebookCard
              key={item.id || item.file_path}
              item={item}
              currentUserId={auth.userId || null}
              adminIds={adminIds}
              layout={viewMode}
            />
          ))}
        </div>
      )}
      {usingFallback && (
        <div className="rounded-alain-lg border border-ink-100 bg-paper-0 p-4 text-sm text-ink-600">
          Live catalog is empty right now. Showing a curated set of GitHub notebooks so you can preview the viewer experience.
        </div>
      )}
    </div>
  );
}
