export default function Footer() {
  return (
    <footer className="mt-16 bg-paper-50 border-t border-ink-100 text-ink-700">
      <div className="mx-auto max-w-7xl px-6 md:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="font-display font-semibold text-ink-900">ALAIN</div>
            <p className="mt-2 text-sm">Open AI learning with clear blueprints and accessible UI.</p>
            <div className="mt-3">
              <a
                href="https://www.linkedin.com/in/danielpgreen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center h-10 px-4 rounded-[12px] border border-ink-200 text-alain-blue hover:bg-paper-50"
              >
                Partner with us
              </a>
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
              <li><a className="hover:underline" href="https://www.linkedin.com/in/danielpgreen" target="_blank" rel="noopener noreferrer">Partner with us</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-ink-100 text-xs flex items-center justify-between">
          <div>
            © {new Date().getFullYear()} ALAIN · Developed by {" "}
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
