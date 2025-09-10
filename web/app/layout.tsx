import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "ALAIN - Applied Learning AI Notebooks",
  description: "Interactive AI learning platform with real models and hands-on tutorials",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const OfflineBadge = dynamic(() => import("../components/OfflineBadge"), { ssr: false });
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <header className="brand-header flex items-center justify-between p-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/brand/alain-monogram.svg"
                alt="ALAIN"
                width={28}
                height={28}
                priority
              />
              <Image
                src="/brand/alain-wordmark.svg"
                alt="ALAIN wordmark"
                width={160}
                height={40}
                className="hidden sm:block"
                priority
              />
              {/* Show small notice when backend strict offline is enabled */}
              <OfflineBadge />
            </Link>
            <SignedOut>
              <SignInButton />
              <SignUpButton />
            </SignedOut>
            <SignedIn>
              <div className="flex items-center gap-3">
                <Link href="/tutorials" className="text-sm text-brand-blue hover:underline">Tutorials</Link>
                <Link href="/settings" className="text-sm text-brand-blue hover:underline">Settings</Link>
                <UserButton />
              </div>
            </SignedIn>
          </header>
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
