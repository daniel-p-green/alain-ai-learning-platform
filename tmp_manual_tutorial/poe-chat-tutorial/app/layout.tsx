import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poe Multi-Model Chat Tutorial",
  description: "Learn to build a streaming chat UI with Poe-hosted models and telemetry instrumentation."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
