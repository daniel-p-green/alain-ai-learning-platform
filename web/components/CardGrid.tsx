import Card from "./Card";
import Link from "next/link";

export default function CardGrid() {
  return (
    <section className="mx-auto max-w-7xl px-6 md:px-8 py-12">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card title="Generate Lessons" cta={<Link className="inline-flex items-center h-10 px-4 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900" href="/generate">Open</Link>}>
          Paste a model card link and produce a runnable notebook with steps, concepts, and checks.
        </Card>
        <Card title="Browse Tutorials" cta={<Link className="inline-flex items-center h-10 px-4 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900" href="/tutorials">Explore</Link>}>
          Explore curated tutorials across providers with consistent patterns and clear outcomes.
        </Card>
        <Card title="Configure Providers" cta={<Link className="inline-flex items-center h-10 px-4 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900" href="/settings">Configure</Link>}>
          Connect hosted or local providers and validate configuration for smooth runs.
        </Card>
      </div>
    </section>
  );
}

