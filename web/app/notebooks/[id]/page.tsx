import NotebookViewer from "@/components/NotebookViewer";

async function fetchNotebook(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/notebooks/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function NotebookPage({ params }: { params: { id: string } }) {
  const rec = await fetchNotebook(params.id);
  if (!rec) {
    return <div className="mx-auto max-w-3xl p-6">Notebook not found.</div>;
  }
  return (
    <div className="mx-auto max-w-3xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{rec.meta.title}</h1>
          <p className="text-sm text-ink-600">{rec.meta.sourceType}{rec.meta.sourceOrg ? ` • ${rec.meta.sourceOrg}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/notebooks/${rec.meta.id}/edit`} className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-ink-200 text-ink-900 font-medium">Edit</a>
          <form action={`/api/notebooks/${rec.meta.id}/remix`} method="post">
            <button className="inline-flex items-center h-10 px-4 rounded-alain-lg bg-alain-yellow text-alain-blue font-semibold">Remix</button>
          </form>
        </div>
      </div>
      <NotebookViewer nb={rec.nb} />
    </div>
  );
}
