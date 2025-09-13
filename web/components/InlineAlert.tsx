export default function InlineAlert({ type = 'info', children }: { type?: 'info'|'warn'|'error'|'success'; children: React.ReactNode }) {
  const s = type === 'error'
    ? 'border-red-200 bg-red-50 text-red-800'
    : type === 'warn'
    ? 'border-yellow-200 bg-yellow-50 text-yellow-800'
    : type === 'success'
    ? 'border-green-200 bg-green-50 text-green-800'
    : 'border-ink-100 bg-paper-50 text-ink-900';
  return <div className={"rounded-card border p-3 text-sm " + s}>{children}</div>;
}

