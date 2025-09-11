# ALAIN UI Refresh — Migration Notes

Removed classes
- Replaced ad‑hoc grays with tokens: use `text-ink-900`, `text-ink-700`, `border-ink-100`, `bg-paper-0`, `bg-paper-50`.
- Replaced `rounded` uses on cards with `rounded-card` (14 px).
- Replaced generic shadows on cards with `shadow-card` and hover `shadow-cardHover`.

New tokens
- Colors: `alain.blue`, `alain.yellow`, `alain.stroke`, `alain.navy`, `ink.{900,700,100}`, `paper.{0,50,100}`.
- Fonts: `font-display` (Montserrat), `font-inter` (Inter), `font-logo` via League Spartan variable.
- Radius: `rounded-card`.
- Shadows: `shadow-card`, `shadow-cardHover`.

Utilities
- `.surface` neutral card background with border and shadow.
- `.prose-app` long‑form content typography.

TODOs
- Audit existing pages for color aliases still using `brand.*` and switch to `alain.*` where feasible.
- Replace remaining inline styles with Tailwind utilities.
- Add Storybook entries for NavBar, Card, Accordion, and Footer.

