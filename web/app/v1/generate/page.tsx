import { redirect } from 'next/navigation';

export const metadata = {
  title: 'ALAIN · Generate Manual',
  description: 'Generate a step-by-step, runnable manual.',
};

export default function LegacyGenerate() {
  redirect('/generate');
}

