"use client";
import { useEffect, useState } from "react";

export default function LocalRuntimeStatus() {
  const [detected, setDetected] = useState<null | boolean>(null);
  const [label, setLabel] = useState<string>("Detecting…");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resp = await fetch('/api/setup', { cache: 'no-store' });
        const data = await resp.json();
        if (!alive) return;
        const models = Array.isArray(data?.availableModels) ? data.availableModels : [];
        setDetected(models.length > 0);
        if (models.length > 0) setLabel('Local runtime detected'); else setLabel('Local runtime not found');
      } catch {
        if (!alive) return;
        setDetected(false);
        setLabel('Local runtime not found');
      }
    })();
    return () => { alive = false; };
  }, []);

  if (detected === null) return null;

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border select-none ${detected ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
      {label}
    </span>
  );
}

