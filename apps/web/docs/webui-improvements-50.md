# ALAIN Web UI — 50 Improvement Ideas (Review Only)

Note: This is a review document. No code changes made.

## Visual Design & Legibility
1. Increase base text contrast for secondary copy (e.g., muted foreground) to meet WCAG AA on light backgrounds.
2. Standardize card borders at `border-border/70` and reduce shadow spread for a crisper, less muddy feel.
3. Use a consistent white background for hero/primary sections; avoid subtle tints that lower contrast.
4. Normalize placeholder color to `placeholder:text-muted-foreground/80` and ensure readable on white.
5. Enforce a consistent heading scale (`text-display-*`) across pages to reduce hierarchy drift.
6. Increase line-height for long paragraph copy in forms to improve scanability.
7. Ensure icon strokes are at least 1.5px on high‑density screens for clarity.
8. Add a global “max line length” (~72–80ch) for paragraphs in wide layouts to avoid long measures.

## Navigation & Information Architecture
9. Make the top nav highlight the current section (Preview, Pipeline, Run anywhere) with an underline + color token.
10. Add a secondary subnav or context tabs on Generate to group Brief, Source, Environment, and Output.
11. Provide a persistent “Generate” action in the header on the Generate page (sticky on scroll).
12. Add a breadcrumb in the Preview and Notebooks areas to ease back‑navigation.
13. Consolidate links to GitHub and Docs into a single “Help & Docs” menu with quick links.
14. Expose “Recent manuals” in the header menu to quickly re-open drafts.

## Forms & Input UX
15. Prefill the Title with an intelligent suggestion after pasting a HF link (owner/model → readable title).
16. Add autosave for the brief and source selections to localStorage with timestamped recovery.
17. Support `Cmd/Ctrl+Enter` to trigger Generate from any focused field.
18. Convert quick presets into a single‑select segmented control to prevent ambiguous multi‑selection.
19. Replace basic textareas with `character count` and recommended ranges to guide concise briefs.
20. Add inline validation summaries beneath fields instead of only toast errors.
21. Support pasting multiple HF links and select one (or batch mode) with a radio list.
22. Add “Environment preflight” button that validates API keys/endpoints before Generate.

## Accessibility
23. Ensure all interactive controls have visible focus rings with ≥3:1 contrast against background.
24. Provide ARIA `aria-live="polite"` region in the preview area for generation status updates.
25. Label all icon‑only buttons with `aria-label` and `title` attributes.
26. Add `skip to main content` link at the top of the page for keyboard users.
27. Respect `prefers-reduced-motion` by disabling non-essential transitions and scrolling animations.
28. Verify color pairs for WCAG AA in dark mode (and prepare tokens if dark mode is enabled later).

## Responsiveness & Layout
29. Make the Generate page split‑pane resizable with a drag handle; remember width per user.
30. Use a mobile-first stack that places the preview after inputs; add a floating Generate CTA on small screens.
31. Introduce `max-w-[1180px]` (already used) consistently across sections to avoid layout jumps.
32. Provide a two-line clamp on long model names with tooltip expansion to prevent overflow.
33. Add container queries for the preview panel so code cells format well on narrow widths.

## Feedback & States
34. Replace empty preview placeholder with a skeleton of a notebook (headers, code cells, outputs) to set expectations.
35. Show an inline progress meter with named stages (Outline, Sections, Validators) during generation.
36. Add a retry button with last‑run parameters surfaced when generation fails.
37. Provide non-blocking success toast that includes a deep link to download or open the notebook.
38. Include a persistent, dismissible environment readiness panel that collapses to a pill after validation.

## Performance & Loading
39. Lazy‑load heavy components like the Notebook preview; show instant skeleton to reduce perceived latency.
40. Preload the primary font subsets and inline critical CSS for above‑the‑fold content.
41. Use route‑level `Suspense` boundaries with fallbacks to avoid layout shift.
42. Memoize high‑cost components (preview cells) and virtualize long lists where applicable.
43. Cache HF model metadata lookups with SWR/React Query + stale‑while‑revalidate.

## Content & Messaging
44. Tighten helper copy beneath fields to one sentence; move details into tooltips or “Learn more”.
45. Align CTA verbs: use “Generate” consistently instead of alternating with “Get started” in the same flow.
46. Add contextual examples for briefs by difficulty level (Beginner/Advanced) to guide prompt quality.
47. Provide an inline link to “What ALAIN generates” with a short checklist and sample preview.

## Reliability & Error Handling
48. Surface exact provider/runtime in use with a status pill (Poe | OpenAI | Local) and last check time.
49. Map common backend errors to plain‑language explanations with suggested fixes (e.g., token limits, network).
50. Add an error boundary around the preview with a “Report issue” link and captured diagnostics (sanitized).

— End of review —

