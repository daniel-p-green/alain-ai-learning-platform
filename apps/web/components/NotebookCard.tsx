"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotebookDirectoryItem } from "@/app/notebooks/page";

type Props = {
  item: NotebookDirectoryItem;
  currentUserId: string | null;
  adminIds: string[];
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

export default function NotebookCard({ item, currentUserId, adminIds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [visibility, setVisibility] = useState<Visibility>(item.visibility);
  const [shareSlug, setShareSlug] = useState<string | null | undefined>(item.share_slug);
  const [toast, setToast] = useState<string | null>(null);
  const canManage = Boolean(currentUserId && (item.created_by === currentUserId || adminIds.includes(currentUserId)));

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

  return (
    <div className="flex h-full flex-col rounded-xl border border-ink-100 bg-white/80 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">
            {item.title || item.model}
          </h2>
          <p className="text-xs text-ink-600">
            {item.model} · {item.provider} · <span className="uppercase">{item.difficulty}</span>
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${visibility === 'public' ? 'bg-alain-blue text-white' : visibility === 'unlisted' ? 'bg-amber-100 text-amber-800' : 'bg-ink-200 text-ink-800'}`}>
          {visibility.toUpperCase()}
        </span>
      </div>

      {maker && (maker.name || maker.org_type) && (
        <div className="mt-3 rounded-lg border border-ink-100 bg-paper-0 p-3 text-xs text-ink-700">
          <div className="font-medium text-ink-900">{maker.name || 'Model Maker'} {maker.org_type && <span className="text-ink-600">· {maker.org_type}</span>}</div>
          <div className="space-x-2">
            {maker.license && <span>License: {maker.license}</span>}
            {maker.homepage && <a href={maker.homepage} target="_blank" className="underline">Homepage</a>}
            {maker.repo && <a href={maker.repo} target="_blank" className="underline">Repo</a>}
          </div>
          {Array.isArray(maker.responsible_use) && maker.responsible_use.length > 0 && (
            <ul className="mt-1 list-disc pl-4">
              {maker.responsible_use.slice(0, 3).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-ink-600 space-y-1">
        {quality && <div>Quality score: {quality}</div>}
        {typeof item.section_count === 'number' && <div>Sections: {item.section_count}</div>}
        {item.colab_compatible !== undefined && item.colab_compatible !== null && (
          <div>Colab: {item.colab_compatible ? '✅ Compatible' : '⚠️ Needs review'}</div>
        )}
        {lastGenerated && <div>Last generated: {lastGenerated}</div>}
        {Array.isArray(item.tags) && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] uppercase tracking-wide text-ink-700">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <a
          className="inline-flex items-center rounded-alain-lg border border-ink-100 bg-paper-0 px-3 py-1"
          href={`/notebooks/${encodeURIComponent(shareSlug || item.file_path)}`}
        >
          View
        </a>
        <a
          className="inline-flex items-center rounded-alain-lg border border-ink-100 bg-paper-0 px-3 py-1"
          href={`/api/files/download?path=${encodeURIComponent(item.file_path)}`}
        >
          Download
        </a>
        <button
          type="button"
          className="inline-flex items-center rounded-alain-lg bg-ink-900 px-3 py-1 text-white"
          onClick={copyShareLink}
        >
          Copy Share Link
        </button>
        {canManage && (
          <select
            className="inline-flex h-8 items-center rounded-alain-lg border border-ink-200 bg-white px-2 text-xs"
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
      {toast && <p className="mt-2 text-xs text-ink-600">{toast}</p>}
    </div>
  );
}
