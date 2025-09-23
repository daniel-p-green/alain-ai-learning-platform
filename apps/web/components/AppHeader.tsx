"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import BrandLogo from "./BrandLogo";
import { Button } from "./Button";
import { ButtonLink } from "./ButtonLink";
import { cn } from "@/lib/utils";
import { hasClerk } from "@/lib/env";
import HFQuickOpen from "./HFQuickOpen";

const navigation = [
  { href: "/#preview", label: "Preview" },
  { href: "/#pipeline", label: "Pipeline" },
  { href: "/#providers", label: "Run anywhere" },
  { href: "https://github.com/AppliedLearningAI/alain-ai-learning-platform", label: "GitHub", external: true },
];

export function AppHeader() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = () => setIsOpen(false);

  // Body scroll lock + restore focus on close
  useEffect(() => {
    if (typeof document === "undefined") return;
    const body = document.body;
    if (isOpen) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
      // return focus to trigger
      triggerRef.current?.focus();
    }
    return () => {
      body.style.overflow = "";
    };
  }, [isOpen]);

  // ESC key and basic focus trap inside the drawer
  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsOpen(false);
      }
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    // move initial focus into panel
    setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
      first?.focus();
    }, 0);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="ALAIN home" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
            <BrandLogo variant="blue" width={110} height={36} />
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-2 lg:flex">
            {navigation.map((item) => {
              const isHashLink = item.href.includes("#");
              const isActive = !item.external && !isHashLink && pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3 py-2 text-small font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            <ButtonLink href="/generate" variant="primary" className="shadow-md">
              Get started
            </ButtonLink>
            {hasClerk ? (
              <>
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button variant="ghost" size="md" className="hover:bg-muted/60">
                      Sign in
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <UserButton
                    appearance={{
                      variables: {
                        borderRadius: "9999px",
                      },
                      elements: {
                        userButtonAvatarBox: "h-9 w-9",
                        userButtonTrigger:
                          "h-10 w-10 rounded-full border border-border bg-card shadow-sm transition hover:border-primary/40",
                      },
                    }}
                    signInUrl="/sign-in"
                    afterSignOutUrl="/"
                  />
                </SignedIn>
              </>
            ) : (
              <Button variant="ghost" asChild>
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
          {/* Desktop quick Hugging Face open (xl and up) */}
          <div className="hidden xl:block w-[420px]">
            <HFQuickOpen
              size="compact"
              showError={false}
              expandOnFocus
              suggestions={[
                "tiiuae/falcon-7b",
                "mistralai/Mistral-7B-Instruct-v0.2",
                "Qwen/Qwen2-7B-Instruct",
                "google/gemma-2-2b-it",
                "meta-llama/Llama-3.1-8B-Instruct",
              ]}
            />
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm transition hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => setIsOpen(true)}
            aria-label="Open main menu"
            aria-haspopup="dialog"
            aria-expanded={isOpen}
            aria-controls={panelId}
            ref={triggerRef}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
      {isOpen ? (
        <div role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/40" aria-hidden="true" onClick={closeMenu} />
          <div
            id={panelId}
            ref={panelRef}
            className="fixed inset-y-0 right-0 flex w-full max-w-[90vw] sm:max-w-sm flex-col bg-background shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
                <BrandLogo variant="blue" width={96} height={32} />
              </Link>
              <button
                type="button"
                onClick={closeMenu}
                aria-label="Close menu"
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <nav aria-label="Mobile primary" className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-small font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                onClick={closeMenu}
              >
                Home
              </Link>
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  onClick={closeMenu}
                  className="rounded-lg px-3 py-2 text-small font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-border px-4 py-5">
              <ButtonLink href="/generate" variant="primary" className="w-full justify-center" onClick={closeMenu}>
                Get started
              </ButtonLink>
              {hasClerk ? (
                <div className="mt-3">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <Button variant="secondary" className="w-full">
                        Sign in
                      </Button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-3">
                      <span className="text-sm font-semibold text-foreground">Your account</span>
                      <UserButton
                        appearance={{
                          elements: {
                            userButtonAvatarBox: "h-9 w-9",
                            userButtonTrigger: "h-9 w-9 rounded-full border border-border bg-card",
                          },
                        }}
                        signInUrl="/sign-in"
                        afterSignOutUrl="/"
                      />
                    </div>
                  </SignedIn>
                </div>
              ) : (
                <ButtonLink href="/sign-in" variant="secondary" className="mt-3 w-full justify-center" onClick={closeMenu}>
                  Sign in
                </ButtonLink>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
