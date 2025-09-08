import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Page() {
  return (
    <div style={{ padding: 24 }}>
      <section style={{ maxWidth: 920, margin: "0 auto" }}>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, margin: 0 }}>
          Learn AI by Doing — Guided, Streaming, Authenticated
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: 18, marginTop: 12 }}>
          Hands-on tutorials with real-time model outputs via SSE streaming.
          Sign in to start, then try the streaming demo.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <a
              href="/stream"
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                background: "#2563EB",
                color: "white",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Try Streaming Demo
            </a>
          </SignedIn>
        </div>
      </section>
    </div>
  );
}
