"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";

type Item = { id: string; path: string; title?: string; author?: string; moderation?: string; published?: boolean };

export default function MyNotebooks() {
  const { user } = useUser();
  const [items, setItems] = useState<Item[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/notebooks?details=1&limit=100", { cache: "no-store" });
      const j = await res.json();
      setItems(j.items || []);
    })();
  }, []);
  const mine = useMemo(() => items.filter((i) => i.author && user?.id && i.author === user.id), [items, user?.id]);
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Notebooks</h1>
      <div className="space-y-2">
        {mine.map((i) => (
          <div key={i.id} className="rounded border p-3 flex items-center justify-between">
            <div>
              <div className="font-medium"><Link href={`/notebooks/${i.id}`}>{i.title || i.id}</Link></div>
              <div className="text-xs text-ink-600">{i.id} • {i.published ? 'published' : (i.moderation || 'pending')}</div>
            </div>
            {!i.published && (i.moderation || 'pending') !== 'pending' && (
              <form action={`/api/notebooks/${i.id}/publish-request`} method="post">
                <button className="h-8 px-3 rounded bg-alain-blue text-white">Request Publish</button>
              </form>
            )}
          </div>
        ))}
        {mine.length === 0 && <div className="text-ink-600">No notebooks yet.</div>}
      </div>
    </div>
  );
}

