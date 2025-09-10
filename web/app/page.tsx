import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="p-6">
      <section className="max-w-4xl mx-auto">
        <h1 className="text-4xl leading-tight m-0 font-bold text-ink">
          Learn AI by Doing — Guided, Streaming, Authenticated
        </h1>
        <p className="text-gray-400 text-lg mt-3">
          Hands-on tutorials with real-time model outputs via SSE streaming.
          Sign in to start, then try the streaming demo.
        </p>

        <div className="flex gap-3 mt-5">
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <a
              href="/stream"
              className="px-4 py-2 rounded-lg bg-brand-blue text-white no-underline font-semibold hover:brightness-95 transition-all"
            >
              Try Streaming Demo
            </a>
          </SignedIn>
        </div>
      </section>
    </div>
  );
}
