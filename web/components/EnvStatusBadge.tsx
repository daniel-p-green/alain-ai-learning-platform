"use client";
import { useEffect, useState } from "react";

type Probe = {
  offlineMode?: boolean;
  teacherProvider?: string | null;
  openaiBaseUrl?: string | null;
  poeConfigured?: boolean;
};

export default function EnvStatusBadge() {
  const [probe, setProbe] = useState<Probe | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await fetch('/api/setup', { cache: 'no-store' });
        const data = await resp.json();
        if (!alive) return; setProbe(data);
      } catch { setProbe({}); }
    })();
    return () => { alive = false; };
  }, []);

  if (!probe) return null;
  const { offlineMode, teacherProvider, poeConfigured } = probe;
  if (offlineMode) {
    return <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 select-none">Offline</span>;
  }
  const poe = teacherProvider === 'poe';
  const label = poe ? (poeConfigured ? 'Poe configured' : 'Poe missing') : (teacherProvider ? teacherProvider : 'Hosted');
  const ok = poe ? !!poeConfigured : !!teacherProvider;
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border select-none ${ok ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
      {label}
    </span>
  );
}

