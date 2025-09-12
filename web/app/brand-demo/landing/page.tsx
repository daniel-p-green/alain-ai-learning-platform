import Hero from "@/components/Hero";
import CardGrid from "@/components/CardGrid";

export const metadata = {
  title: "ALAIN Brand Demo — Landing",
};

export default function LandingDemo() {
  return (
    <div className="bg-paper-0 text-ink-900">
      <Hero />
      <CardGrid />
      <section className="mx-auto max-w-7xl px-6 md:px-8 py-16">
        <div className="rounded-card border border-alain-stroke/15 bg-alain-card text-ink-900 p-8 md:flex items-center justify-between shadow-alain-sm">
          <div>
            <h2 className="font-display font-bold text-[32px] leading-[38px] tracking-tight">Ship your first lesson today</h2>
            <p className="font-inter text-[18px] leading-[28px] text-ink-700 mt-2">Run a model in minutes with clear steps and checks.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <a className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold" href="/generate">Try ALAIN</a>
            <a className="inline-flex items-center h-11 px-5 rounded-[12px] border border-alain-stroke/30 text-alain-blue" href="/tutorials">View Docs</a>
          </div>
        </div>
      </section>
    </div>
  );
}
