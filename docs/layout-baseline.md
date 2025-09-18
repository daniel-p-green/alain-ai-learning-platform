# Layout Modernization Audit — Phase 0 Baseline

_Last updated: $(date +%Y-%m-%d)_

## 1. Navigation State

- **Dual implementations**: `NavBar.tsx` (authenticated) and `NavBarPublic.tsx` (unauthenticated) diverge in color scheme, logo usage, CTA layout, and focus order.
- **Skip link behavior**: Skip link is rendered before nav only when Clerk is active (`RootLayout`). Public route still uses skip link but nav height/contrast differ.
- **Mobile drawer**: `MobileNav.tsx` maintains readable contrast in authenticated variant but loses clarity in public navbar due to translucent background + white text.

### Screenshots/Notes
- Desktop authenticated vs unauthenticated nav (contrast + spacing discrepancies).
- Mobile hamburger menu contrast issue in public navbar; document fix targets (background overlay & text color tokens).

## 2. Core Page Layouts

| Page | File | Max Width / Padding | Observed Issues |
| --- | --- | --- | --- |
| Home | `apps/web/app/page.tsx` | `max-w-7xl`, custom section paddings | Typography + spacing custom per section; CTAs not using shared button component. |
| Generate | `apps/web/features/generate/components/GenerateLessonView.tsx` | `max-w-[1400px]`, ad hoc gaps | Workspace and form columns not using shared layout primitive; progress indicators + buttons drift from design tokens. |
| Notebook Edit | `apps/web/app/notebooks/[id]/edit/page.tsx` | `max-w-6xl`, responsive grid | Action buttons for “Add Markdown/Code” relocate between bottom and sidebar; needs consistent toolbar. |

## 3. Design Tokens & Components

- `Button.tsx` variants differ from hero/nav buttons (hero uses bespoke classes).
- Color tokens (`bg-alain-blue`, etc.) applied directly in multiple files; lacks centralized scale for dark-mode readiness.
- Typography system mixes `font-display`, `font-inter`, and direct `text-[34px]` declarations without tokenization.

## 4. Baseline Metrics (to gather)

- Lighthouse (Performance, Accessibility, Best Practices) for `/`, `/generate`, `/notebooks/[id]/edit` (once stable data).
- axe-core CLI or manual DevTools pass for accessibility violations.
- Core Web Vitals: capture CLS/LCP from local run via Chrome trace.

## 5. Success Metrics Alignment

- **Navigation**: Single reusable top nav, consistent branding, WCAG AA contrast.
- **Layout**: Shared `AppShell` with standardized breakpoints and spacing tokens.
- **Accessibility**: Keyboard traversal, skip link, ARIA landmarks validated across auth states.
- **Performance**: Maintain or improve baseline Lighthouse > 90 (A11y/Best Practices), CLS < 0.1, LCP < 2.5s (local proxy).

## 6. Next Steps (Phase 0 wrap-up)

- Annotate screenshots for nav, generate workspace, notebook editor (desktop & mobile) — stored in `/docs/layout-baseline/` (TODO once gathered).
- Run initial Lighthouse + axe passes and append numeric results here.
- Present findings for sign-off before Phase 1 implementation.
