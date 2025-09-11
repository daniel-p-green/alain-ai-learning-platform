import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-paper-0 text-ink-900">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-8 lg:grid-cols-2 items-center">
        <div className="space-y-5">
          <p className="uppercase tracking-wide text-xs text-ink-700">Open learning</p>
          <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">ALAIN: blueprints for real AI workflows</h1>
          <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-prose">
            Learn, build, and share with clear templates and accessible patterns. Stay aligned with the ALAIN brand system and pass accessibility checks.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/generate" className="inline-flex items-center h-11 px-5 rounded-[12px] bg-alain-yellow text-alain-blue font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Get Started</Link>
            <Link href="/tutorials" className="inline-flex items-center h-11 px-5 rounded-[12px] border border-ink-100 bg-paper-0 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Browse Tutorials</Link>
          </div>
        </div>
        <div className="justify-self-center">
          <Image src="/brand/ALAIN_logo_primary_blue-bg.svg" width={320} height={170} alt="ALAIN primary logo" className="rounded-[12px] shadow-card" />
        </div>
      </div>
    </section>
  );
}

