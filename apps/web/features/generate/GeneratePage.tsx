'use client';

import { useSettings } from '../onboarding-settings/useSettings';
import { GenerateLessonView } from './components/GenerateLessonView';
import { useGenerateLesson } from './hooks/useGenerateLesson';
import { useEffect, useState } from 'react';
import { Toast } from '@/components/Toast';

export default function GenerateLessonPage() {
  const { promptMode } = useSettings();
  const viewModel = useGenerateLesson({ promptMode });
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    if (q.get('hf')) {
      setToast('Hugging Face link captured. Ready to generate.');
      const t = setTimeout(() => setToast(null), 3200);
      return () => clearTimeout(t);
    }
  }, []);
  return (
    <>
      {toast ? <Toast message={toast} onClose={() => setToast(null)} /> : null}
      <GenerateLessonView {...viewModel} />
    </>
  );
}
