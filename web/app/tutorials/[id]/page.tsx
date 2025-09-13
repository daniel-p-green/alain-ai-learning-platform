import { redirect } from 'next/navigation';

export default function LegacyTutorialRedirect({ params }: { params: { id: string } }) {
  redirect(`/notebooks/${params.id}`);
}
