"use client";
import { useEffect, useState } from "react";
import { backendUrl } from "../lib/backend";

export default function OfflineBadge() {
  const [offline, setOffline] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await fetch(backendUrl('/health'), { cache: 'no-store' });
        if (!resp.ok) return;
        const data = await resp.json();
        if (!alive) return;
        if (data?.offlineMode) setOffline(true);
        if (data?.teacherProvider) setProvider(String(data.teacherProvider));
        if (data?.openaiBaseUrl) setBaseUrl(String(data.openaiBaseUrl));
      } catch {
        // ignore
      }
    })();
    return () => { alive = false; };
  }, []);

  if (!offline) return null;

  const detailLines = [
    `Provider: ${provider || 'unknown'}`,
    provider === 'openai-compatible' ? `Base URL: ${baseUrl || 'not set'}` : `Base URL: N/A`,
  ];

  return (
    <span
      className="relative ml-3 inline-flex items-center"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800 border border-yellow-200 select-none">
        OFFLINE MODE
      </span>
      {hover && (
        <span className="absolute left-0 top-full mt-2 z-50 w-max max-w-xs rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 shadow-sm">
          <div className="font-semibold mb-1">Strict offline enabled</div>
          {detailLines.map((l, i) => (
            <div key={i} className="whitespace-nowrap">{l}</div>
          ))}
        </span>
      )}
    </span>
  );
}
