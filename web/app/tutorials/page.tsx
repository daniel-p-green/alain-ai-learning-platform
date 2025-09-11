"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/Button";

type Tutorial = {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: string;
  tags: string[];
  created_at: string;
  model_maker_name?: string | null;
};

type PaginationInfo = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

type FiltersInfo = {
  difficulties: string[];
  providers: string[];
  tags: string[];
  modelMakers?: string[];
};

type TutorialsResponse = {
  tutorials: Tutorial[];
  pagination: PaginationInfo;
  filters: FiltersInfo;
};

type FilterState = {
  difficulty: string;
  provider: string;
  tags: string[];
  search: string;
  modelMaker: string;
};

export default function TutorialsPage() {
  const [data, setData] = useState<TutorialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    difficulty: "",
    provider: "",
    tags: [],
    search: "",
    modelMaker: "",
  });

  useEffect(() => {
    loadTutorials(1);
  }, []);

  const loadTutorials = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: "12",
        ...(filters.difficulty && { difficulty: filters.difficulty }),
        ...(filters.provider && { provider: filters.provider }),
        ...(filters.search && { search: filters.search }),
        ...(filters.tags.length > 0 && { tags: filters.tags.join(",") }),
        ...(filters.modelMaker && { modelMaker: filters.modelMaker })
      });

      const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
      const res = await fetch(`${base}/tutorials?${params}`, { cache: "no-store" });
      const responseData = await res.json();
      setData(responseData);
    } catch (error) {
      console.error("Failed to load tutorials:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Reload with new filters
    setTimeout(() => loadTutorials(1), 100);
  };

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
    setTimeout(() => loadTutorials(1), 100);
  };

  const clearFilters = () => {
    setFilters({
      difficulty: "",
      provider: "",
      tags: [],
      search: "",
      modelMaker: "",
    });
    loadTutorials(1);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !data) {
    return (
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-ink-100 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-paper-100 rounded-card border border-ink-100"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 md:px-8 py-8 space-y-6 text-ink-900">
      <div className="flex items-center justify-between">
        <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">Tutorials</h1>
        <div className="flex items-center gap-3">
          {data && (
            <span className="text-sm text-ink-700">
              {data.pagination.total} tutorials
            </span>
          )}
          <Button
            onClick={async ()=>{
              try {
                setSeeding(true);
                setNotice(null);
                const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
                const res = await fetch(`${base}/seed`, { method: 'POST' });
                const j = await res.json().catch(()=>({}));
                if (j?.inserted) {
                  setNotice('Sample lessons loaded');
                } else {
                  setNotice('Samples already present');
                }
                await loadTutorials(1);
              } catch (e) {
                setNotice('Failed to load samples');
              } finally {
                setSeeding(false);
                setTimeout(()=> setNotice(null), 2500);
              }
            }}
            disabled={seeding}
            className="text-sm"
            variant="primary"
            title="Insert curated sample tutorials if none exist"
          >{seeding ? 'Loading…' : 'Load Sample'}</Button>
        </div>
      </div>

      {notice && (
        <div className="text-sm text-ink-900 bg-paper-50 border border-ink-100 rounded-card px-3 py-2">{notice}</div>
      )}

      {/* Search and Filters */}
      <div className="bg-paper-50 border border-ink-100 rounded-card p-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search tutorials..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="flex-1 px-3 py-2 bg-paper-0 border border-ink-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
          />
          <Button onClick={() => loadTutorials(1)} variant="primary">Search</Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-ink-900">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 bg-paper-0 border border-ink-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
            >
              <option value="">All Levels</option>
              {data?.filters.difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Provider Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-ink-900">Provider</label>
            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              className="w-full px-3 py-2 bg-paper-0 border border-ink-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
            >
              <option value="">All Providers</option>
              {data?.filters.providers.map(provider => (
                <option key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Model Maker Filter */}
          <div>
            <label className="block text-sm font-medium mb-2 text-ink-900">Model Maker</label>
            <select
              value={filters.modelMaker}
              onChange={(e) => handleFilterChange('modelMaker', e.target.value)}
              className="w-full px-3 py-2 bg-paper-0 border border-ink-100 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
            >
              <option value="">All Creators</option>
              {(data?.filters.modelMakers || []).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
          <Button onClick={clearFilters} variant="secondary" className="w-full">Clear Filters</Button>
          </div>
        </div>

        {/* Tags */}
        {data?.filters.tags && data.filters.tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2 text-ink-900">Tags</label>
            <div className="flex flex-wrap gap-2">
              {data.filters.tags.slice(0, 10).map(tag => (
                <Button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  variant={filters.tags.includes(tag) ? 'primary' : 'secondary'}
                  className={filters.tags.includes(tag) ? 'text-sm px-3 py-1' : 'text-sm px-3 py-1 text-ink-700'}
                >
                  #{tag}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data?.tutorials.map((tutorial) => (
          <div key={tutorial.id} className="border border-ink-100 rounded-card p-4 bg-paper-0 shadow-card hover:shadow-cardHover transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h2 className="font-display font-semibold text-[20px] leading-[28px]">{tutorial.title}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                {tutorial.difficulty}
              </span>
            </div>

            <p className="text-ink-700 mb-3 line-clamp-2 font-inter">{tutorial.description}</p>

            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-ink-700">{tutorial.provider}</span>
              <span className="text-ink-700">•</span>
              <span className="text-ink-700">{tutorial.model}</span>
              {process.env.NEXT_PUBLIC_GITHUB_REPO && (
                <>
                  <span className="text-ink-700">•</span>
                  <a
                    className="text-alain-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
                    target="_blank"
                    rel="noopener noreferrer"
                    href={buildColabUrl(tutorial.provider, tutorial.model)}
                  >Open in Colab</a>
                </>
              )}
              {tutorial.model_maker_name && (<>
                <span className="text-ink-700">•</span>
                <span className="text-ink-700">{tutorial.model_maker_name}</span>
              </>)}
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {tutorial.tags?.slice(0, 4).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-paper-100 border border-ink-100 rounded text-xs text-ink-700">
                  #{tag}
                </span>
              ))}
              {tutorial.tags && tutorial.tags.length > 4 && (
                <span className="px-2 py-0.5 bg-paper-100 border border-ink-100 rounded text-xs text-ink-700">
                  +{tutorial.tags.length - 4}
                </span>
              )}
            </div>

            <a
              href={`/tutorial/${tutorial.id}`}
              className="inline-block h-10 px-4 py-2 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue"
            >
              Start Tutorial
            </a>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button onClick={() => loadTutorials(data.pagination.page - 1)} disabled={!data.pagination.hasPrev} variant="secondary" className="px-3 py-1 text-sm">Previous</Button>

          <span className="text-sm text-ink-700">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>

          <Button onClick={() => loadTutorials(data.pagination.page + 1)} disabled={!data.pagination.hasNext} variant="secondary" className="px-3 py-1 text-sm">Next</Button>
        </div>
      )}

      {/* Empty State */}
      {data?.tutorials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-ink-700 mb-4">📚</div>
          <h3 className="font-display font-semibold text-[24px] leading-[30px] mb-2">No tutorials found</h3>
          <p className="font-inter text-ink-700 mb-4">Try adjusting your filters or search terms</p>
          <Button onClick={clearFilters} variant="primary">Clear Filters</Button>
        </div>
      )}
    </div>
  );
}

function buildColabUrl(provider: string, model: string) {
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO!; // assumed set by caller
  const branch = process.env.NEXT_PUBLIC_GITHUB_BRANCH || 'main';
  const segments = (model || '').split('/').map(encodeURIComponent);
  const path = ['notebooks', encodeURIComponent(provider), ...segments, 'lesson.ipynb'].join('/');
  return `https://colab.research.google.com/github/${repo}/***REMOVED***/${encodeURIComponent(branch)}/${path}`;
}
