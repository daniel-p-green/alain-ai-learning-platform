import NotebookCard from '@/components/NotebookCard';
import { safeAuth } from '@/lib/auth';
import { appBaseUrl } from '@/lib/requestBase';

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

export default async function NotebooksPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const qs = new URLSearchParams();
  if (searchParams?.model) qs.set('model', searchParams.model);
  if (searchParams?.provider) qs.set('provider', searchParams.provider);
  if (searchParams?.difficulty) qs.set('difficulty', searchParams.difficulty);
  if (searchParams?.tag) qs.set('tag', searchParams.tag);
  qs.set('limit', String(Math.max(1, Math.min(50, Number(searchParams?.limit || 24)))));

  const [items, auth] = await Promise.all([fetchCatalog(qs), safeAuth()]);
  const adminIds = (process.env.ADMIN_USER_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6 text-ink-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Notebook Library</h1>
          <p className="text-sm text-ink-600">Filter generated manuals by model, provider, or difficulty.</p>
        </div>
        <div className="flex items-center gap-2">
          <a className="inline-flex items-center h-10 px-4 rounded-alain-lg border border-ink-100 bg-paper-0" href="/notebooks/featured">Featured</a>
          <a className="inline-flex items-center h-10 px-4 rounded-alain-lg border border-ink-100 bg-paper-0" href="/generate">Generate</a>
        </div>
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
          <span className="text-xs text-ink-500">Match the runtime used to generate the notebook.</span>
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

      {items.length === 0 ? (
        <p className="text-ink-700">No notebooks found. Adjust filters.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <NotebookCard
              key={item.id || item.file_path}
              item={item}
              currentUserId={auth.userId || null}
              adminIds={adminIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
