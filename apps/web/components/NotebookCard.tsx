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

function resolveExternalUrl(slug?: string | null) {
  if (!slug) return null;
  if (slug.startsWith("gh:")) {
    const gh = slug.slice(3);
    const colonIndex = gh.indexOf(":");
    if (colonIndex === -1) return null;
    const repoRef = gh.slice(0, colonIndex);
    const filePath = gh.slice(colonIndex + 1);
    const atIndex = repoRef.indexOf("@");
    const [ownerRepo, ref] = atIndex === -1 ? [repoRef, "main"] : [repoRef.slice(0, atIndex), repoRef.slice(atIndex + 1) || "main"];
    const slashIndex = ownerRepo.indexOf("/");
    if (slashIndex === -1) return null;
    const owner = ownerRepo.slice(0, slashIndex);
    const repo = ownerRepo.slice(slashIndex + 1);
    return `https://github.com/${owner}/${repo}/blob/${ref}/${filePath}`;
  }
  if (slug.startsWith("http://") || slug.startsWith("https://")) return slug;
  return null;
}

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
  const isFallback = typeof item.id === "number" && item.id < 0;
  const externalUrl = resolveExternalUrl(shareSlug || item.file_path);

  const shareUrl = useMemo(() => {
    if (isFallback && externalUrl) return externalUrl;
    const base = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");
    const target = shareSlug || item.file_path;
    return `${base}/notebooks/${encodeURIComponent(target)}`;
  }, [externalUrl, isFallback, shareSlug, item.file_path]);

  const viewHref = isFallback && externalUrl ? externalUrl : `/notebooks/${encodeURIComponent((shareSlug || item.file_path) ?? "")}`;
  const downloadHref = !isFallback ? `/api/files/download?path=${encodeURIComponent(item.file_path)}` : null;

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
      if (!shareUrl) {
        setToast("No link available");
        return;
      }
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
  const statItems = [
    quality ? { label: "Quality", value: quality } : null,
    typeof item.section_count === "number" ? { label: "Sections", value: String(item.section_count) } : null,
    item.colab_compatible !== undefined && item.colab_compatible !== null
      ? { label: "Colab", value: item.colab_compatible ? "✅ Compatible" : "⚠️ Needs review" }
      : null,
    lastGenerated ? { label: "Updated", value: lastGenerated } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;
  const displayedStats = isList ? statItems : statItems.slice(0, 2);
  const limitedTags = isList ? visibleTags : visibleTags.slice(0, 3);

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
          <p
            className={cn("text-sm text-ink-600", !isList && "text-[13px] leading-5")}
            style={!isList ? { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" } : undefined}
          >
            {overview}
          </p>
        )}

        {isList && maker && (maker.name || maker.org_type) && (
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

        {displayedStats.length > 0 && (
          <dl className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-600">
            {displayedStats.map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-1">
                <dt className="font-semibold text-ink-800">{stat.label}:</dt>
                <dd>{stat.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {limitedTags.length > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-2">
              {limitedTags.map((tag) => (
                <span key={tag} className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-700">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className={cn(
          "mt-5 flex flex-wrap gap-2 text-sm",
          isList ? "sm:mt-0 sm:w-48 sm:flex-col" : "items-center"
        )}
      >
        <a
          className="inline-flex items-center justify-center rounded-alain-lg bg-ink-900 px-4 py-2 font-semibold text-white transition hover:bg-ink-900/90"
          href={viewHref}
          target={isFallback ? "_blank" : undefined}
          rel={isFallback ? "noreferrer" : undefined}
        >
          {isFallback ? "View source" : "Open notebook"}
        </a>
        {!isFallback && downloadHref && (
          <a
            className={cn(
              isList
                ? "inline-flex items-center justify-center rounded-alain-lg border border-ink-200 px-4 py-2 text-ink-700 transition hover:border-ink-300"
                : "text-xs font-medium text-ink-600 underline-offset-2 hover:underline"
            )}
            href={downloadHref}
          >
            Download
          </a>
        )}
        {isList ? (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-alain-lg border border-ink-200 px-4 py-2 text-ink-700 transition hover:border-ink-300 disabled:opacity-60"
            onClick={copyShareLink}
            disabled={!shareUrl}
          >
            Share
          </button>
        ) : (
          <button
            type="button"
            className="text-xs font-semibold text-alain-blue underline-offset-2 transition hover:underline disabled:opacity-60"
            onClick={copyShareLink}
            disabled={!shareUrl}
          >
            Share link
          </button>
        )}
        {canManage && !isFallback && isList && (
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
