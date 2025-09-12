"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Item = { id: string; path: string };

export default function NotebooksGallery() {
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/notebooks");
      const j = await res.json();
      setItems(j.items || []);
    })();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return items;
    return items.filter((i) => i.id.toLowerCase().includes(t));
  }, [items, q]);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Notebooks</h1>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by id" className="rounded border px-3 py-2 w-64" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((i) => (
          <Link key={i.id} href={`/notebooks/${i.id}`} className="rounded border p-4 hover:border-alain-blue">
            <div className="font-semibold">{i.id}</div>
            <div className="text-xs text-ink-600">{i.path}</div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-ink-600">No notebooks found.</div>
        )}
      </div>
    </div>
  );
}

