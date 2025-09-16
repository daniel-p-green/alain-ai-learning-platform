import { ReactNode } from "react";

export default function Card({ title, children, cta }: { title: string; children: ReactNode; cta?: ReactNode }) {
  return (
    <article className="bg-paper-50 border border-ink-100 rounded-card shadow-card hover:shadow-cardHover transition-shadow">
      <div className="p-6 space-y-3">
        <h3 className="font-display font-semibold text-[24px] leading-[30px] tracking-tight text-ink-900">{title}</h3>
        <div className="font-inter text-[16px] leading-[26px] text-ink-700">{children}</div>
        {cta && <div className="pt-2">{cta}</div>}
      </div>
    </article>
  );
}

