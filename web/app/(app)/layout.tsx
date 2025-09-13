export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block border-r border-ink-100 bg-paper-50">
        <div className="h-16 flex items-center px-4 font-display font-semibold text-ink-900">ALAIN</div>
        <nav className="px-2 py-3 space-y-1 text-sm">
          <a className="block px-3 py-2 rounded-[10px] hover:bg-paper-0" href="/generate">Generate</a>
          <a className="block px-3 py-2 rounded-[10px] hover:bg-paper-0" href="/tutorials">Tutorials</a>
          <a className="block px-3 py-2 rounded-[10px] hover:bg-paper-0" href="/my/notebooks">Notebooks</a>
          <a className="block px-3 py-2 rounded-[10px] hover:bg-paper-0" href="/settings">Settings</a>
        </nav>
      </aside>
      <div className="flex flex-col min-h-screen">
        <header className="h-16 border-b border-ink-100 bg-white flex items-center px-4 justify-between">
          <div className="font-display font-semibold">ALAIN</div>
          <a className="inline-flex items-center h-10 px-4 rounded-[10px] bg-alain-yellow text-alain-blue font-semibold" href="/generate">Get Started</a>
        </header>
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

