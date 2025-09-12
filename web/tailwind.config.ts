import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Back-compat alias for existing usage
        brand: {
          blue: "#0058A3", // alain-blue
          yellow: "#FFDA1A", // alain-yellow
        },
        // ALAIN brand tokens (flat utility keys)
        "alain-blue": "#0058A3",
        "alain-yellow": "#FFDA1A",
        "alain-stroke": "#004580",
        "alain-navy": "#1E3A8A",
        "alain-card": "#F7F7F6",
        "alain-bg": "#FFFFFF",
        "alain-text": "#111827",
        // Dark-mode mapping (optional)
        "alain-dark-bg": "#0B1220",
        "alain-dark-low": "#1E3A8A",
        // Structured (legacy) token group retained for compatibility
        alain: {
          blue: "#0058A3",
          yellow: "#FFDA1A",
          stroke: "#004580",
          navy: "#1E3A8A",
        },
        // Expanded neutrals for flexible UI contrast
        ink: {
          DEFAULT: "#111827",
          50: "#F9FAFB",
          100: "#F3F4F6",
          200: "#E5E7EB",
          300: "#D1D5DB",
          400: "#9CA3AF",
          500: "#6B7280",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
          900: "#111827",
        },
        paper: {
          0: "#FFFFFF",
          50: "#FAFAF9",
          100: "#F5F5F4",
        },
        // Semantics
        success: {
          600: "#16A34A",
          700: "#15803D",
        },
        danger: {
          600: "#DC2626",
          700: "#B91C1C",
        },
        warning: {
          600: "#D97706",
          700: "#B45309",
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
        // Convenience aliases used by brand snippets
        montserrat: ["Montserrat", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
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
        brand: "12px", // single radius for consistency
        tab: "10px",
        card: "12px",
        // Utility: `rounded-alain-lg`
        "alain-lg": "12px",
      },
      boxShadow: {
        brand: "0 1px 2px rgba(15, 23, 42, 0.06)",
        card: "0 1px 3px rgba(0,0,0,0.12)",
        cardHover: "0 4px 10px rgba(15,23,42,0.08), 0 0 0 1px rgba(17,24,39,0.08)",
        // Utility: `shadow-alain-sm`
        "alain-sm": "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
} satisfies Config;
