import type { Metadata } from "next";
import { League_Spartan, Inter, Montserrat } from "next/font/google";
import NavBar from "../components/NavBar";
import NavBarPublic from "../components/NavBarPublic";
import Footer from "../components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import { hasClerk } from "../lib/env";
import Script from "next/script";
import "./globals.css";

const FALLBACK_SITE_URL = "http://localhost:3000";

function resolveSiteUrl(raw?: string | null): string {
  if (!raw) return FALLBACK_SITE_URL;
  try {
    return new URL(raw).toString();
  } catch {
    try {
      return new URL(`https://${raw}`).toString();
    } catch {
      return FALLBACK_SITE_URL;
    }
  }
}

const resolvedSiteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

// next/font must be initialized at module scope
const league = League_Spartan({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-logo" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  metadataBase: new URL(resolvedSiteUrl),
  title: "ALAIN - Applied Learning AI Notebooks",
  description: "Interactive AI learning platform with real models and hands-on tutorials",
  authors: [{ name: "Daniel Green", url: "https://linkedin.com/in/danielpgreen" }],
  creator: "Daniel Green",
  openGraph: {
    title: "ALAIN - Applied Learning AI Notebooks",
    description: "Interactive AI learning platform with real models and hands-on tutorials",
    images: [{ url: "/og/alain-box.jpg", width: 1200, height: 630, alt: "ALAIN — AI Model Inside" }],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@dgrreen",
    site: "@dgrreen",
    title: "ALAIN - Applied Learning AI Notebooks",
    description: "Interactive AI learning platform with real models and hands-on tutorials",
    images: ["/og/alain-box.jpg"],
  },
};

function MaybeClerk({ children }: { children: React.ReactNode }) {
  if (hasClerk) return <ClerkProvider>{children}</ClerkProvider>;
  return <>{children}</>;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MaybeClerk>
      <html lang="en">
        <head>
          <link rel="author" href="https://linkedin.com/in/danielpgreen" />
          <link rel="me" href="https://linkedin.com/in/danielpgreen" />
          <link rel="me" href="https://x.com/dgrreen" />
          <Script id="person-jsonld" type="application/ld+json" strategy="beforeInteractive">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: "Daniel Green",
              url: "https://linkedin.com/in/danielpgreen",
              sameAs: [
                "https://linkedin.com/in/danielpgreen",
                "https://x.com/dgrreen"
              ],
              worksFor: {
                "@type": "Organization",
                name: "ALAIN"
              }
            })}
          </Script>
        </head>
        <body className={`bg-alain-bg text-alain-text antialiased ${league.variable} ${inter.variable} ${montserrat.variable} font-inter`}>
          {/* Skip link for keyboard users */}
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-alain-blue text-white px-3 py-1 rounded">Skip to content</a>
          {/* NavBar with mobile drawer */}
          {hasClerk ? <NavBar /> : <NavBarPublic />}
          <main id="main" className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          {/* Footer on every page */}
          <Footer />
        </body>
      </html>
    </MaybeClerk>
  );
}
