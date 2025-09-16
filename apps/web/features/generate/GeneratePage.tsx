'use client';

import { useSettings } from '../onboarding-settings/useSettings';
import { GenerateLessonView } from './components/GenerateLessonView';
import { useGenerateLesson } from './hooks/useGenerateLesson';

export default function GenerateLessonPage() {
  const { promptMode } = useSettings();
  const viewModel = useGenerateLesson({ promptMode });
  return <GenerateLessonView {...viewModel} />;
}
