import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Breadcrumb = {
  href?: string;
  label: string;
};

type PageHeaderProps = {
  eyebrow?: string;
  headline?: string;
  description?: ReactNode;
  breadcrumbs?: Breadcrumb[];
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  meta?: ReactNode;
  className?: string;
  media?: ReactNode;
};

export function PageHeader({
  eyebrow,
  headline,
  description,
  breadcrumbs,
  primaryAction,
  secondaryAction,
  meta,
  className,
  media,
}: PageHeaderProps) {
  return (
    <section className={cn("border-b border-border/80 bg-background", className)}>
      <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-6 px-4 py-10 md:px-6 md:py-12">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-caption text-muted-foreground">
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1;
              if (isLast || !crumb.href) {
                return (
                  <span key={crumb.label} className="font-semibold text-muted-foreground">
                    {crumb.label}
                  </span>
                );
              }
              return (
                <span key={crumb.label} className="flex items-center gap-2">
                  <Link
                    href={crumb.href}
                    className="rounded-md px-1.5 py-1 text-caption text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {crumb.label}
                  </Link>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              );
            })}
          </nav>
        ) : null}
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4 md:max-w-xl">
            {eyebrow ? (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-caption font-semibold uppercase tracking-[0.18em] text-primary">
                {eyebrow}
              </span>
            ) : null}
            <div className="space-y-3">
              <h1 className="text-display-1 text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground">AI Manuals for AI Models</h1>
              {headline ? <h2 className="text-display-2 font-semibold text-muted-foreground">{headline}</h2> : null}
              {description ? <p className="max-w-3xl text-sm text-muted-foreground md:text-base">{description}</p> : null}
            </div>
            {meta ? <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">{meta}</div> : null}
            {(primaryAction || secondaryAction) && (
              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                {secondaryAction}
                {primaryAction}
              </div>
            )}
          </div>
          {media ? <div className="w-full max-w-lg md:flex-1">{media}</div> : null}
        </div>
      </div>
    </section>
  );
}
