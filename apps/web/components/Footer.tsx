import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-16 bg-paper-50 border-t border-ink-100 text-ink-700">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/brand/ALAIN_logo_primary_blue-bg.svg" alt="ALAIN" width={88} height={32} className="h-8 w-auto" />
              <span className="font-display text-sm font-semibold text-ink-900">AI Manuals for AI Models</span>
            </div>
          </div>
          <div>
            <div className="font-display font-semibold text-ink-900">Product</div>
            <ul className="mt-2 space-y-1 text-sm">
              <li><a className="hover:underline" href="/notebooks">Notebooks</a></li>
              <li><a className="hover:underline" href="/generate">Generate</a></li>
            </ul>
          </div>
          <div>
            <div className="font-display font-semibold text-ink-900">Community</div>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <a
                  className="hover:underline"
                  href="https://github.com/daniel-p-green/alain-ai-learning-platform"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  className="hover:underline"
                  href="https://x.com/dgrreen"
                  target="_blank"
                  rel="noopener noreferrer me"
                >
                  X (@dgrreen)
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-ink-100 pt-6 text-xs text-ink-700">
          <div className="flex items-center gap-2">
            © {new Date().getFullYear()} ALAIN • Developed by
            <a
              href="https://linkedin.com/in/danielpgreen"
              target="_blank"
              rel="noopener noreferrer me"
              className="hover:underline"
            >
              Daniel Green
            </a>
          </div>
          <div className="flex gap-3 text-ink-700">
            <a
              href="https://github.com/daniel-p-green/alain-ai-learning-platform/blob/main/docs/notebooks/data-privacy-and-secrets.md"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Privacy
            </a>
            <a
              href="https://github.com/daniel-p-green/alain-ai-learning-platform/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
