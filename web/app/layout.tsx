import type { Metadata } from "next";
import { League_Spartan, Inter, Montserrat } from "next/font/google";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

// next/font must be initialized at module scope
const league = League_Spartan({ subsets: ["latin"], weight: ["700", "900"], variable: "--font-logo" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "ALAIN - Applied Learning AI Notebooks",
  description: "Interactive AI learning platform with real models and hands-on tutorials",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`bg-alain-bg text-alain-text antialiased ${league.variable} ${inter.variable} ${montserrat.variable} font-inter`}>
          {/* Skip link for keyboard users */}
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-alain-blue text-white px-3 py-1 rounded">Skip to content</a>
          {/* NavBar with mobile drawer */}
          <NavBar />
          <main id="main" className="min-h-[calc(100vh-64px)]">
            {children}
          </main>
          {/* Footer on every page */}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
