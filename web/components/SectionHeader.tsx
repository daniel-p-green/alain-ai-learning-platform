export default function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-2">
      <h3 className="font-display font-semibold text-[18px] leading-[24px] tracking-tight text-ink-900">{title}</h3>
      {subtitle && <p className="text-sm text-ink-700 mt-0.5">{subtitle}</p>}
    </div>
  );
}

