import "../globals.css";

type Tutorial = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  tags: string[];
};

async function getTutorials(): Promise<Tutorial[]> {
  const base = process.env.NEXT_PUBLIC_BACKEND_BASE || "http://localhost:4000";
  const res = await fetch(`${base}/tutorials`, { cache: "no-store" });
  const data = await res.json();
  return data.tutorials ?? [];
}

export default async function TutorialsPage() {
  const tutorials = await getTutorials();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Tutorials</h1>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tutorials.map((t) => (
          <li key={t.id} className="border border-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold">{t.title}</h2>
            <p className="text-gray-400 mt-1">{t.description}</p>
            <div className="flex gap-2 mt-2 text-sm text-gray-300">
              <span className="px-2 py-0.5 bg-gray-800 rounded">{t.difficulty}</span>
              {t.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gray-800 rounded">#{tag}</span>
              ))}
            </div>
            <a className="inline-block mt-3 text-blue-400 hover:underline" href={`/tutorial/${t.id}`}>
              Open
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

