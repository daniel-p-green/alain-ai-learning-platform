export const metadata = {
  title: "ALAIN — Concepts Index",
  description: "Quick links to in-progress concepts and demos.",
};

const links: Array<{ href: string; title: string; desc: string }> = [
  { href: "/blueprint", title: "Blueprint (Tokens)", desc: "Primary brand page using new ALAIN design tokens." },
  { href: "/blueprint/agent", title: "Agent Variant", desc: "Gradient hero, bold agent-style landing." },
  { href: "/blueprint/devtool", title: "Devtool Variant", desc: "Developer-focused hero with code emphasis." },
  { href: "/blueprint/anthropic", title: "Anthropic Variant", desc: "Soft, academic landing concept." },
  { href: "/brand-demo/landing", title: "Brand Demo Landing", desc: "WIP brand showcase landing." },
  { href: "/generate", title: "Generate", desc: "HF / Local / From Text lesson generation." },
  { href: "/tutorials", title: "Tutorials Directory", desc: "Browse, search, and filter tutorials." },
  { href: "/phases", title: "ALAIN‑Kit Phases", desc: "Research / Design / Develop / Validate prompt runner." },
  { href: "/lmstudio", title: "LM Studio Explorer", desc: "Local model explorer; shows banner if SDK missing." },
  { href: "/settings", title: "Settings", desc: "Runtime presets and offline/hosted toggles." },
  { href: "/health", title: "Health", desc: "Simple diagnostics and environment info." },
];

export default function ConceptsIndex() {
  return (
    <div className="mx-auto max-w-5xl px-6 md:px-8 py-10 space-y-6 text-ink-900">
      <h1 className="font-display font-bold text-[36px] leading-[42px] tracking-tight">Concepts Index</h1>
      <p className="font-inter text-ink-700">Explore branding variants and product flows independently.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((l) => (
          <a key={l.href} href={l.href} className="p-4 rounded-card bg-paper-0 border border-ink-100 shadow-card hover:shadow-cardHover transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-alain-blue">
            <div className="font-display font-semibold text-[18px] leading-[24px]">{l.title}</div>
            <div className="text-sm font-inter text-ink-700 mt-1">{l.desc}</div>
            <div className="mt-3 text-alain-blue text-sm">{l.href}</div>
          </a>
        ))}
      </div>
    </div>
  );
}

