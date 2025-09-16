"use client";
import { useEffect } from "react";

type ToastProps = {
  message: string;
  variant?: "success" | "error" | "info";
  onClose: () => void;
  autoHideMs?: number;
};

export function Toast({ message, variant = "info", onClose, autoHideMs = 3000 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose(), autoHideMs);
    return () => clearTimeout(t);
  }, [autoHideMs, onClose]);

  const color =
    variant === "success"
      ? "bg-green-600 border-green-500"
      : variant === "error"
      ? "bg-red-600 border-red-500"
      : "bg-gray-700 border-gray-600";

  return (
    <div className="fixed bottom-4 right-4 z-50" role="status" aria-live="polite">
      <div className={`text-sm text-white px-4 py-2 rounded shadow-lg border ${color} flex items-center gap-3`}>
        <span>{message}</span>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 text-white/80 hover:text-white focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}
