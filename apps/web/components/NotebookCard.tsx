"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotebookDirectoryItem } from "@/app/notebooks/page";
import { cn } from "@/lib/utils";

type Props = {
  item: NotebookDirectoryItem;
  currentUserId: string | null;
  adminIds: string[];
  layout?: "grid" | "list";
};

type Visibility = NotebookDirectoryItem["visibility"];

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

function formatDate(value?: string | null) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString();
  } catch {
    return null;
  }
}

function formatQuality(score?: number | null) {
  if (typeof score !== "number") return null;
  return `${score}/100`;
}

export default function NotebookCard({ item, currentUserId, adminIds, layout = "grid" }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState<Visibility>(item.visibility);
  const [shareSlug, setShareSlug] = useState<string | null | undefined>(item.share_slug);
  const [toast, setToast] = useState<string | null>(null);
  const canManage = Boolean(currentUserId && (item.created_by === currentUserId || adminIds.includes(currentUserId)));
  const isList = layout === "list";

  const shareUrl = useMemo(() => {
    const base = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const target = shareSlug || item.file_path;
    return `${base}/notebooks/${encodeURIComponent(target)}`;
  }, [shareSlug, item.file_path]);

  async function updateVisibility(nextVisibility: Visibility) {
    startTransition(async () => {
      try {
        setToast("Saving…");
        const res = await fetch("/api/catalog/notebooks/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_path: item.file_path, visibility: nextVisibility }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
        setVisibility(nextVisibility);
        if (data?.share_slug) setShareSlug(data.share_slug);
        setToast(nextVisibility === "public" ? "Published" : nextVisibility === "unlisted" ? "Share link ready" : "Marked private");
        router.refresh();
      } catch (err: any) {
        setToast(err?.message || "Failed to update");
      } finally {
        setTimeout(() => setToast(null), 2500);
      }
    });
  }

  async function copyShareLink() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setToast("Share link copied");
      } else {
        setToast("Copy not supported");
      }
    } catch (err: any) {
      setToast(err?.message || "Failed to copy");
    } finally {
      setTimeout(() => setToast(null), 2000);
    }
  }

  const maker = item.maker;
  const lastGenerated = formatDate(item.last_generated || item.created_by ? item.last_generated : undefined);
  const quality = formatQuality(item.quality_score);
  const overview = item.overview;
  const visibleTags = Array.isArray(item.tags) ? item.tags.slice(0, 6) : [];

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-ink-100 bg-white/90 p-5 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-alain-blue/40 hover:shadow-lg",
        isList && "sm:flex-row sm:items-start sm:gap-6"
      )}
    >
      <div className={cn("flex flex-1 flex-col gap-3", isList && "sm:py-1")}
      >
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold leading-tight text-ink-900">
              {item.title || item.model}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
              <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-700">
                {item.difficulty}
              </span>
              <span>{item.model}</span>
              <span className="text-ink-400">•</span>
              <span className="capitalize">{item.provider}</span>
            </div>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold",
              visibility === "public" && "bg-alain-blue text-white",
              visibility === "unlisted" && "bg-amber-100 text-amber-800",
              visibility === "private" && "bg-ink-200 text-ink-800"
            )}
          >
            {visibility.toUpperCase()}
          </span>
        </header>

        {overview && (
          <p className="text-sm text-ink-600">
            {overview}
          </p>
        )}

        {maker && (maker.name || maker.org_type) && (
          <div className="text-xs text-ink-500">
            <span className="font-medium text-ink-700">By {maker.name || "Community maker"}</span>
            {maker.org_type && <span> · {maker.org_type}</span>}
            <div className="mt-1 flex flex-wrap gap-3">
              {maker.license && <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-700">{maker.license}</span>}
              {maker.homepage && (
                <a className="text-ink-600 underline" href={maker.homepage} target="_blank" rel="noreferrer">
                  Homepage
                </a>
              )}
              {maker.repo && (
                <a className="text-ink-600 underline" href={maker.repo} target="_blank" rel="noreferrer">
                  Repo
                </a>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-2 text-xs text-ink-600 sm:grid-cols-2">
          {quality && <div><span className="font-semibold text-ink-800">Quality:</span> {quality}</div>}
          {typeof item.section_count === "number" && <div><span className="font-semibold text-ink-800">Sections:</span> {item.section_count}</div>}
          {item.colab_compatible !== undefined && item.colab_compatible !== null && (
            <div><span className="font-semibold text-ink-800">Colab:</span> {item.colab_compatible ? "✅ Compatible" : "⚠️ Needs review"}</div>
          )}
          {lastGenerated && <div><span className="font-semibold text-ink-800">Updated:</span> {lastGenerated}</div>}
        </div>

        {visibleTags.length > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span key={tag} className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-700">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={cn("mt-5 flex flex-wrap gap-2 text-sm", isList && "sm:mt-0 sm:w-48 sm:flex-col")}
      >
        <a
          className="inline-flex items-center justify-center rounded-alain-lg bg-ink-900 px-4 py-2 font-semibold text-white transition hover:bg-ink-900/90"
          href={`/notebooks/${encodeURIComponent(shareSlug || item.file_path)}`}
        >
          View notebook
        </a>
        <a
          className="inline-flex items-center justify-center rounded-alain-lg border border-ink-200 px-4 py-2 text-ink-700 transition hover:border-ink-300"
          href={`/api/files/download?path=${encodeURIComponent(item.file_path)}`}
        >
          Download
        </a>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-alain-lg border border-ink-200 px-4 py-2 text-ink-700 transition hover:border-ink-300"
          onClick={copyShareLink}
        >
          Copy share link
        </button>
        {canManage && (
          <select
            className="inline-flex h-9 items-center rounded-alain-lg border border-ink-200 bg-white px-3 text-xs"
            value={visibility}
            onChange={(e) => updateVisibility(e.target.value as Visibility)}
            disabled={isPending}
          >
            <option value="private">Private</option>
            <option value="unlisted">Unlisted (share link)</option>
            <option value="public">Public</option>
          </select>
        )}
      </div>

      {toast && <p className="mt-3 text-xs text-ink-600">{toast}</p>}
    </article>
  );
}
