import type { ReactNode } from "react";
import { Button } from "./Button";

export type NotebookToolbarAction = {
  key: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "primary" | "accent" | "secondary" | "danger";
};

type NotebookToolbarProps = {
  title?: ReactNode;
  actions?: NotebookToolbarAction[];
  children?: ReactNode;
  className?: string;
};

export function NotebookToolbar({ title, actions = [], children, className }: NotebookToolbarProps) {
  return (
    <div
      className={[
        "flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-ink-100 bg-white/95 px-4 py-3 shadow-card",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-1">
        {typeof title === "string" ? <span className="text-sm font-semibold text-ink-900">{title}</span> : title}
        {children && <div className="text-xs text-ink-500">{children}</div>}
      </div>
      {actions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.key}
              variant={action.variant ?? "secondary"}
              onClick={action.onClick}
              disabled={action.disabled}
              className="h-9 px-3"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {action.icon}
                {action.label}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
