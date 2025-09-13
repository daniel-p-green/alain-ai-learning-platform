import { redirect } from 'next/navigation';

export const metadata = {
  title: 'ALAIN · Home',
  description: 'AI Manuals for AI Models',
};

export default function BlueprintPage() {
  redirect('/');
}
