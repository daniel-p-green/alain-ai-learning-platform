# UI Refresh Cleanup Summary

- Removed temporary shim functions `NavBarShim` and inline `Footer` loader from `web/app/layout.tsx`. Imported `NavBar` and `Footer` directly.
- Standardized containers to `max-w-7xl px-6 md:px-8` and text tokens `text-ink-900`.
- Replaced ad-hoc gray classes with tokenized neutrals (`ink` and `paper`) on:
  - `web/app/blueprint/page.tsx`
  - `web/app/settings/page.tsx`
- Normalized CTAs to use brand accents:
  - Primary: `bg-alain-yellow text-alain-blue` with visible focus ring.
  - Secondary: neutral button with `border-ink-100 bg-paper-0`.
- Harmonized typography:
  - Headings: `font-display` with fixed sizes (40/44, 32/38, 24/30).
  - Body: `font-inter` with 18/28.
- Cards and surfaces:
  - Switched to `rounded-card` (14 px) and `shadow-card` with `shadow-cardHover`.
- Accessibility:
  - Ensured focus-visible rings on interactive elements.
  - Confirmed copy avoids low-contrast pairs (yellow on white).

Removed optional tooling for hackathon focus
- Deleted Storybook scaffolding (`web/.storybook/`) and all component stories (`web/components/__stories__/`).
- Rationale: zero overhead and no added scope during the event. Reintroduce later if needed for design review.

No logic or component APIs changed. All updates are className-only and cosmetic.
