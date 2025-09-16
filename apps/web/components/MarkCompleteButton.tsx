"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function MarkCompleteButton({ tutorialId, stepOrder }: { tutorialId: number|string; stepOrder: number }) {
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const router = useRouter();
  return (
    <button
      className={`mt-3 inline-flex items-center px-3 py-1.5 rounded text-xs ${done ? 'bg-green-600 text-white' : 'bg-alain-blue text-white'}`}
      disabled={busy}
      onClick={async ()=>{
        setBusy(true);
        try {
          await fetch(`/api/tutorials/${encodeURIComponent(String(tutorialId))}/progress`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ step_order: stepOrder })
          });
          setDone(true);
          setTimeout(()=>{
            router.refresh();
            setDone(false);
          }, 800);
        } finally {
          setBusy(false);
        }
      }}
    >{busy ? 'Saving…' : (done ? 'Saved' : 'Mark Complete')}</button>
  );
}

