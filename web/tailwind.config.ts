import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Back-compat alias for existing usage
        brand: {
          blue: "#0058A3", // alain-blue
          yellow: "#FFDA1A", // alain-yellow
        },
        // ALAIN brand tokens
        alain: {
          blue: "#0058A3",
          yellow: "#FFDA1A",
          stroke: "#004580",
          navy: "#1E3A8A",
          navyAlt: "#1E40AF",
        },
        ink: {
          DEFAULT: "#111827",
          900: "#111827",
          700: "#374151",
          100: "#F3F4F6",
        },
        paper: {
          0: "#FFFFFF",
          50: "#FAFAF9",
          100: "#F5F5F4",
        },
      },
      fontFamily: {
        // Display/headers: Montserrat
        display: [
          "Montserrat",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Body: Inter
        inter: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Logo only: League Spartan
        logo: [
          "League Spartan",
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
        brand: "12px", // existing
        tab: "10px",
        card: "14px",
      },
      boxShadow: {
        brand: "0 1px 2px rgba(15, 23, 42, 0.06)",
        card: "0 1px 2px rgba(15,23,42,0.05), 0 0 0 1px rgba(17,24,39,0.06)",
        cardHover: "0 4px 10px rgba(15,23,42,0.08), 0 0 0 1px rgba(17,24,39,0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
