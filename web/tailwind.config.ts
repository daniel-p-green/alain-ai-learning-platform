import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors (assembly-inspired)
        brand: {
          blue: "#0057AD",
          yellow: "#FBDA0C",
        },
        ink: "#111827",
        paper: "#FFFFFF",
      },
      fontFamily: {
        // Display/wordmark stack: League Spartan (Google Font)
        display: [
          "League Spartan",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // App UI default stack
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      borderRadius: {
        brand: "12px", // for pills/tabs/buttons
        tab: "10px",
      },
      boxShadow: {
        brand: "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
