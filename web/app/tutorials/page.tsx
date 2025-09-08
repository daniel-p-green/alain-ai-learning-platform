"use client";

import { useState, useEffect } from "react";
import "../globals.css";

type Tutorial = {
  id: number;
  title: string;
  description: string;
  model: string;
  provider: string;
  difficulty: string;
  tags: string[];
  created_at: string;
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
};

export default function TutorialsPage() {
  const [data, setData] = useState<TutorialsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    difficulty: "",
    provider: "",
    tags: [],
    search: ""
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
        ...(filters.tags.length > 0 && { tags: filters.tags.join(",") })
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
      search: ""
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
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tutorials</h1>
        {data && (
          <span className="text-sm text-gray-400">
            {data.pagination.total} tutorials
          </span>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-900 rounded-lg p-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search tutorials..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={() => loadTutorials(1)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <select
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
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
            <label className="block text-sm font-medium mb-2">Provider</label>
            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Providers</option>
              {data?.filters.providers.map(provider => (
                <option key={provider} value={provider}>
                  {provider.charAt(0).toUpperCase() + provider.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Tags */}
        {data?.filters.tags && data.filters.tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {data.filters.tags.slice(0, 10).map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded text-sm ${
                    filters.tags.includes(tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tutorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.tutorials.map((tutorial) => (
          <div key={tutorial.id} className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h2 className="text-xl font-semibold">{tutorial.title}</h2>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}>
                {tutorial.difficulty}
              </span>
            </div>

            <p className="text-gray-400 mb-3 line-clamp-2">{tutorial.description}</p>

            <div className="flex items-center gap-2 mb-3 text-sm">
              <span className="text-gray-500">{tutorial.provider}</span>
              <span className="text-gray-600">•</span>
              <span className="text-gray-500">{tutorial.model}</span>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {tutorial.tags?.slice(0, 4).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                  #{tag}
                </span>
              ))}
              {tutorial.tags && tutorial.tags.length > 4 && (
                <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">
                  +{tutorial.tags.length - 4}
                </span>
              )}
            </div>

            <a
              href={`/tutorial/${tutorial.id}`}
              className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              Start Tutorial
            </a>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => loadTutorials(data.pagination.page - 1)}
            disabled={!data.pagination.hasPrev}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            Previous
          </button>

          <span className="text-sm text-gray-400">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>

          <button
            onClick={() => loadTutorials(data.pagination.page + 1)}
            disabled={!data.pagination.hasNext}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
          >
            Next
          </button>
        </div>
      )}

      {/* Empty State */}
      {data?.tutorials.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">📚</div>
          <h3 className="text-lg font-medium mb-2">No tutorials found</h3>
          <p className="text-gray-400 mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}

