"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Item = { id: string; path: string; title?: string; sourceType?: string; sourceOrg?: string; tags?: string[]; published?: boolean; moderation?: string; excerpt?: string };

export default function NotebooksGallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [org, setOrg] = useState("");
  const [tag, setTag] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/notebooks?details=1&limit=24");
      const j = await res.json();
      setItems(j.items || []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const o = org.trim().toLowerCase();
    const tg = tag.trim().toLowerCase();
    return items.filter((i) => {
      if (type !== "all" && (i.sourceType || "user") !== type) return false;
      if (t && !(i.title || i.id).toLowerCase().includes(t)) return false;
      if (o && !(i.sourceOrg || "").toLowerCase().includes(o)) return false;
      if (tg && !(i.tags || []).some((x) => x.toLowerCase().includes(tg))) return false;
      return true;
    });
  }, [items, q, type, org, tag]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex flex-wrap items-end gap-3 justify-between">
        <h1 className="text-2xl font-semibold">Notebooks</h1>
        <div className="flex flex-wrap items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title" className="rounded border px-3 py-2 w-56" />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border px-3 py-2">
            <option value="all">All</option>
            <option value="company">Company</option>
            <option value="user">User</option>
          </select>
          <input value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Org" className="rounded border px-3 py-2 w-40" />
          <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag" className="rounded border px-3 py-2 w-40" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((i) => (
          <Link key={i.id} href={`/notebooks/${i.id}`} className="rounded border hover:border-alain-blue overflow-hidden group">
            {i.thumb ? (
              <img src={i.thumb} alt="thumbnail" className="h-24 w-full object-cover" />
            ) : (
              <div className="h-24 bg-gradient-to-br from-alain-blue/10 to-alain-yellow/10 p-3">
                <div className="text-sm text-ink-700 line-clamp-4">{i.excerpt || ""}</div>
              </div>
            )}
            <div className="p-4">
              <div className="font-semibold group-hover:text-alain-blue flex items-center gap-2">
                {i.sourceType === 'company' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-alain-blue text-white">Company</span>}
                <span>{i.title || i.id}</span>
              </div>
              <div className="text-xs text-ink-600 flex items-center gap-2">
                <span>{i.sourceType || 'user'}{i.sourceOrg ? ` • ${i.sourceOrg}` : ''}</span>
                {typeof i.published !== 'undefined' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${i.published ? 'bg-green-200 text-green-900' : (i.moderation==='rejected' ? 'bg-red-200 text-red-900' : 'bg-yellow-200 text-yellow-900')}`}>
                    {i.published ? 'Published' : (i.moderation==='rejected' ? 'Rejected' : 'Pending')}
                  </span>
                )}
              </div>
              {i.tags && i.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {i.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-ink-200 text-ink-900">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-ink-600">No notebooks found.</div>
        )}
      </div>
    </div>
  );
}
