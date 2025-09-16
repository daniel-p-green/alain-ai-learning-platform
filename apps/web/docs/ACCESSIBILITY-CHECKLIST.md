# Accessibility Checklist (ALAIN UI Refresh)

- Keyboard navigation: All interactive controls reachable by Tab and Shift+Tab. Focus visible with `ring-2 ring-alain-blue`.
- Skip link: Present and visible on focus at top of layout.
- Color contrast: AA or higher for body text.
  - Blue on white 7.18 (pass).
  - White on blue 7.18 (pass).
  - Yellow on blue 5.23 (pass for normal text).
  - Blue on yellow 5.23 (pass for normal text).
  - Stroke on yellow 7.07 (pass).
  - Black on yellow 12.92 (pass).
  - Yellow on white 1.37 (fail). Avoid.
  - Blue on black 2.47 (fail for normal text). Use large display only.
- Hit target size: Buttons and links in primary flows >= 44 px height.
- Disclosure/accordion: `aria-expanded` on trigger, content toggles visibility, chevron rotates.
- Mobile drawer: Closes on Escape and outside click. `aria-expanded` and `aria-controls` on toggle button.
- Images: Provide `alt` text for logos and brand images.
- Motion: Hover transitions at ~120 ms ease-out. No parallax or large motion.

Known passes: Nav, hero CTAs, card grids, accordion triggers, skip link.
Known fails: None observed in demo pages.
Open TODO: Audit dynamic pages like tutorials and settings against tokens and focus rings.

