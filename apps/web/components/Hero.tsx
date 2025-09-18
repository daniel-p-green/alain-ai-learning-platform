import Image from "next/image";
import BrandLogo from "./BrandLogo";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-paper-0 text-ink-900">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-8 lg:grid-cols-2 items-center">
        <div className="space-y-5">
          <p className="uppercase tracking-wide text-xs text-ink-700">Open learning</p>
          <h1 className="font-display font-bold text-[40px] leading-[44px] tracking-tight">The open source IKEA instruction layer for AI models</h1>
          <p className="font-inter text-[18px] leading-[28px] text-ink-700 max-w-prose">
            Learn AI with AI: pick any model in Hugging Face, Ollama, or LM Studio and get interactive how‑to guides. Run locally or in the cloud with gpt‑oss.
          </p>
          <div className="flex items-center gap-3">
            <Link href="/generate" className="inline-flex items-center h-11 px-5 rounded-alain-lg bg-alain-blue text-white font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-alain-blue">Generate Manual</Link>
            <Link href="/notebooks" className="inline-flex items-center h-11 px-5 rounded-alain-lg border border-ink-100 bg-paper-0 text-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">Browse Library</Link>
          </div>
        </div>
        <div className="justify-self-center">
          <BrandLogo width={320} height={170} className="rounded-alain-lg shadow-alain-sm" />
        </div>
      </div>
    </section>
  );
}
