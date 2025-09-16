# ALAIN Brand Style Guide v1.0

## Identity Overview
- Brand essence: clear, open, and practical. ALAIN stands for accessible AI learning. The visual identity uses a confident ellipse and a bold wordmark to signal clarity and momentum.
- Primary device: yellow ellipse with optical centering and tight tracking. Wordmark sits inside the ellipse and stays centered on the X axis.
- Type system pairs Montserrat for headers and Inter for body with League Spartan for the logo.

---

## Addendum v1.0.1 — Accessibility and UI Spec Updates

This addendum addresses contrast, logo geometry precision, UI scale gaps, and component specs for the hackathon demo.

Highlights
- Lock ellipse ratio to 2.33 (7:3) for consistency.
- Avoid yellow on white; use blue on yellow/yellow on blue, or add `alain-stroke` border.
- Add UI label sizes and caption/micro to the type scale.
- Expand neutrals (ink 50–900) and add semantic colors (success, danger, warning).
- Use 12 px corner radius everywhere; focus rings use `alain-stroke`.
- Theme-aware logo switching (blue primary by default; yellow variant allowed on yellow header).

Logo geometry (precise values)
- Ellipse ratio: 2.33. Default ellipse: 1400×600 on a 1500×800 canvas.
- Baseline nudge examples (exports from 1500×800 master): 160w → +2 px, 320w → +4 px, 480w → +6 px.
- Tracking: −10 at ≤24 px, −12 at 24–40 px, −15 at ≥48 px (optically adjust).
- Side padding inside ellipse: 15% per side.

Type scale (complete)
- H1 40/44, H2 32/38, H3 24/30
- UI Label Large 16/24, UI Label Medium 15/22
- Body 18/28, Caption 12/18, Micro 10/16

Color & contrast
- Neutrals: `ink` 50–900 (Tailwind configured). Surfaces: `paper` 0/50/100.
- Semantics: success `#16A34A`, danger `#DC2626`, warning `#D97706`.
- Focus ring color: `alain-stroke` `#004580`.
- Never use yellow text on white (fails ~1.37:1). Use blue on yellow or add stroke.

UI component specs
- Buttons
  - Primary: bg `alain.blue`, text white, focus ring `alain.stroke`, hover brightness −5%
  - Secondary: bg `paper.0`, border `ink.100`, text `ink.900`
  - Accent: bg `alain.yellow`, text `alain.blue`, border `alain.stroke`
- Inputs: border `ink.100`, bg `paper.0`, focus ring `alain.stroke`, disabled 40% opacity
- Cards: radius 12 px; shadow `0 1px 3px rgba(0,0,0,0.12)`; hover elevation
- Navigation: primary blue‑bg logo by default; yellow‑bg logo allowed on yellow header theme

Self‑audit (revised)
- Ratio 2.33 locked; default 1400×600 ellipse.
- Tracking −10/−12/−15 by size; baseline nudge +2–6 px.
- Inside padding 15% per side. Clear space 16% of ellipse width/height.
- Contrast AA for text; no yellow‑on‑white.
- Radius 12 px; focus ring `alain-stroke`.

---

## Logo Construction and Ratios
- Canvas reference: 1500×800.
- Ellipse ratio: width to height 2.3 to 2.45. Default ellipse 1400×600.
- Ellipse fill: `#FFDA1A`.
- Portable variant stroke: 12–16 px in `#004580` when used.
- Blue rectangle background homage: `#0058A3`.
- Wordmark: League Spartan Black or Bold.
- Wordmark color: use `#0058A3` on yellow, `#FFFFFF` on black, `#FFDA1A` on blue.
- Tracking target: −10 to −20 (default −15).
- Baseline optical nudge: move text up 1–2% of ellipse height.
- Side padding inside ellipse: 14–16% of ellipse width per side.
- Center alignment: ellipse and wordmark share the same X center.

Simple diagram description: draw a 1400×600 ellipse centered on a 1500×800 canvas. Place the wordmark set in League Spartan Black with tracking −15 centered horizontally. Move it up by 1–2% of ellipse height. Maintain side padding of 14–16% of ellipse width per side.

Clear space outside the mark: keep a minimum clear space equal to 16% of ellipse width on the left and right and 16% of ellipse height on the top and bottom. For the default ellipse 1400×600, clear space equals 224 px left and right and 96 px top and bottom. Clear-space-safe canvas for the default becomes 1848×792.

## Approved Variants and When to Use
Row 1
- `ALAIN_logo_primary_blue-bg.svg` — Primary homage for presentations and hero brand. Use yellow wordmark on blue rectangle background. Do not add shadows. Keep centered.
- `ALAIN_logo_primary_yellow-bg.svg` — Alternate primary on yellow fields. Use blue wordmark on yellow ellipse.

Row 2
- `ALAIN_logo_inverse_white-bg.svg` — Inverse for light backgrounds. Use blue or navy wordmark. Keep ellipse form intact.
- `ALAIN_logo_inverse_black-bg.svg` — Inverse for dark backgrounds. Use white wordmark on black or near-black.

Row 3
- `ALAIN_logo_alt_yellow-ellipse_blue-text.svg` — Portable ellipse-only for light backgrounds. Add a thin `#004580` stroke at 12–16 px if the background is busy.
- `ALAIN_logo_alt_yellow-text_blue-ellipse.svg` — Blue ellipse with yellow text for badges and strong accents.

Row 4
- `ALAIN_logo_darkmode_blue-outline.svg` — Subtle mark for dark UI with low emphasis. Use stroke color `#004580`.
- `ALAIN_logo_darkmode_white-bg.svg` — High-contrast label on white. Use for small UI tags and badges.

## Color System
- alain-blue: `#0058A3` (Tailwind token `alain-blue`)
- alain-yellow: `#FFDA1A` (Tailwind token `alain-yellow`)
- alain-stroke: `#004580` (Tailwind token `alain-stroke`)
- alain-navy-print: `#1E3A8A` or `#1E40AF` (Tailwind tokens `alain-navy-print`, `alain-navy-print-alt`)
- black-900: `#111827` (Tailwind token `black-900`)
- white: `#FFFFFF` (Tailwind token `white`)

Recommended tints and shades: derive a functional scale in CSS only. Do not add additional brand tokens in Tailwind for tints.

Approximate CMYK recipes (for print guidance):
- alain-blue `#0058A3`: C100 M72 Y0 K36
- alain-yellow `#FFDA1A`: C0 M15 Y90 K0
- alain-stroke `#004580`: C100 M46 Y0 K50
- alain-navy-print A `#1E3A8A`: C78 M58 Y0 K46
- alain-navy-print B `#1E40AF`: C83 M63 Y0 K31
- black-900 `#111827`: C56 M38 Y0 K85 (or use 100K for single-ink jobs)

## Typography System
- Logo: League Spartan Black or Bold.
- Headers: Montserrat Bold for H1, Montserrat SemiBold for H2 and H3.
- Body: Inter Regular with Inter Medium for emphasis.
- Suggested scale: H1 40 px with 44 line height, H2 32 px with 38 line height, H3 24 px with 30 line height, Body 18 px with 28 line height, Small 14 px with 22 line height.
- Tracking: headings tight between −1 and −2, body normal. 
- Case: H1 and H2 in Title Case. Body and UI labels in sentence case.

## Layout and Spacing Rules
- Grid: use an 8 px base spacing scale.
- Insets: 8, 12, 16, 24, 32, 48, 64.
- Section spacing: 48 or 64 for desktop. 24 or 32 for mobile.
- Button vertical rhythm: 10–12 px padding top and bottom at 18 px body size.
- Icon sizing: 20, 24, 32, 40.
- Ellipse side padding inside the logo: 14–16% of ellipse width per side.
- Clear space outside the full mark: 16% of ellipse width and height as described in construction.

## Accessibility Guidance
- Target WCAG AA for body text at minimum 4.5:1 contrast.
- Large text (18 pt regular or 14 pt bold and above) may use 3.0:1, but prefer 4.5:1.

Contrast ratios (computed):
- Blue on white: 7.18 (pass AA and AAA for normal text)
- White on blue: 7.18 (pass AA and AAA for normal text)
- Yellow on blue: 5.23 (pass AA for normal text)
- Blue on yellow: 5.23 (pass AA for normal text)
- Stroke on yellow: 7.07 (pass AA and AAA for normal text)
- Black on yellow: 12.92 (pass AA and AAA)
- Yellow on white: 1.37 (fail)
- White on yellow: 1.37 (fail)
- Blue on black: 2.47 (fail for normal text, use larger sizes only)

Logo variant pass and fail notes by background:
- Primary blue background: passes on blue background with yellow wordmark. Passes over photos with sufficient isolation. Avoid busy photos unless you add soft white underlay.
- Primary yellow background: passes on flat yellow fields. Avoid on white since yellow to white fails. Add thin `#004580` stroke on busy photos.
- Inverse white background: passes on white and light neutrals. Avoid on yellow fields.
- Inverse black background: passes on dark backgrounds and photos with dark average luminance.
- Alt yellow ellipse with blue text: passes on white and light neutrals. On photos, add thin `#004580` stroke or soft white underlay.
- Alt blue ellipse with yellow text: passes on blue and dark fields. Avoid small sizes on black to blue text contrast since 2.47 fails for normal text if the text uses blue on black.
- Dark mode blue outline: low emphasis. Use only in dark UI where context supports it.
- Dark mode white background: passes on white UI. Use for labels and badges.

## Print and Packaging Specs for Corrugated Cardboard
- Preferred single-ink: alain-navy-print `#1E3A8A` or `#1E40AF` as a spot color.
- Yellow usage: require a white underbase under `#FFDA1A` on corrugated to keep brightness.
- Black plate: match `#111827` as process or use 100K for one color work. Rich black guidance for offset: C60 M40 Y40 K100 for large solids. Use 100K for text.
- One color recipe: alain-navy-print only.
- Two color recipe: alain-navy-print plus alain-yellow with a white underbase plate for yellow.
- Full color recipe: alain-blue, alain-yellow, alain-stroke as separate spot or use CMYK approximations above, plus white elements as substrate or ink as required.
- Registration: keep the wordmark vector shapes aligned. Avoid hairline traps. Stroke width in portable variant 12–16 px equivalents.

Spot color callouts:
- PMS conversion guidance: map `#0058A3` to a deep process blue PMS family. Map `#FFDA1A` to a bright process yellow PMS family. Confirm with press proofs.
- Underbase note: always specify white underbase for yellow on kraft or corrugated.

## Digital Implementation
Tailwind token mapping and CSS variables:

```js
// tailwind.config.js (snippet)
export default {
  theme: {
    extend: {
      colors: {
        'alain-blue': 'var(--alain-blue)',
        'alain-yellow': 'var(--alain-yellow)',
        'alain-stroke': 'var(--alain-stroke)',
        'alain-navy-print': 'var(--alain-navy-print)',
        'alain-navy-print-alt': 'var(--alain-navy-print-alt)',
        'black-900': 'var(--black-900)',
        'white': 'var(--white)'
      },
      fontFamily: {
        montserrat: ['Montserrat', 'ui-sans-serif', 'system-ui'],
        inter: ['Inter', 'ui-sans-serif', 'system-ui'],
        'league-spartan': ['League Spartan', 'ui-sans-serif', 'system-ui']
      },
      fontSize: {
        h1: ['40px', { lineHeight: '44px', letterSpacing: '-0.01em' }],
        h2: ['32px', { lineHeight: '38px', letterSpacing: '-0.01em' }],
        h3: ['24px', { lineHeight: '30px', letterSpacing: '-0.01em' }],
        body: ['18px', { lineHeight: '28px' }],
        small: ['14px', { lineHeight: '22px' }]
      }
    }
  }
}
```

```css
:root {
  --alain-blue: #0058A3;
  --alain-yellow: #FFDA1A;
  --alain-stroke: #004580;
  --alain-navy-print: #1E3A8A;
  --alain-navy-print-alt: #1E40AF;
  --black-900: #111827;
  --white: #FFFFFF;
}

@layer utilities {
  .heading-1 { @apply font-montserrat font-bold text-h1 tracking-tight text-black-900; }
  .heading-2 { @apply font-montserrat font-semibold text-h2 tracking-tight text-black-900; }
  .heading-3 { @apply font-montserrat font-semibold text-h3 tracking-tight text-black-900; }
  .body-text { @apply font-inter text-body text-black-900; }
  .body-strong { @apply font-inter font-medium text-body text-black-900; }
  .small-text { @apply font-inter text-small text-black-900; }
}
```

Example React hero header using the primary mark:

```tsx
import Image from 'next/image'

export default function HeroHeader() {
  return (
    <header className="bg-alain-blue text-white">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-8 md:grid-cols-[auto,1fr] items-center">
        <div className="w-[320px] h-auto">
          <Image
            src="/brand/ALAIN_logo_primary_blue-bg.svg"
            width={320}
            height={160}
            alt="ALAIN logo"
            priority
          />
        </div>
        <div>
          <h1 className="heading-1 text-white">ALAIN: Open AI Learning</h1>
          <p className="body-text text-white/90 mt-4 max-w-prose">
            Learn, build, and share. Use open models and clear patterns.
          </p>
          <div className="mt-8 flex gap-4">
            <a className="inline-flex items-center rounded-md bg-white px-5 py-3 text-black-900 font-inter font-medium" href="#start">
              Get Started
            </a>
            <a className="inline-flex items-center rounded-md border border-white/30 px-5 py-3 text-white" href="#docs">
              View Docs
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
```

## Governance and Versioning
- Version: 1.0.
- Repository: store masters in `alain-ai-learning-platform/brand`.
- Figma: keep text live for SVG masters under `@alain-wordmarks`. Outline text only for print PDFs.
- Change control: create a new minor version for any token change. Create a new major version for logo geometry changes.

## Asset Export Matrix (summary)
All variants export as SVG master, PDF vector, PNG at 1x 320w, 2x 640w, 4x 1280w, and ICO 32 and 48 where applicable. Provide clear-space-safe versions where the canvas hugs the ellipse plus clear space. See CSV in `brand/ALAIN-Asset-Export-Matrix.csv` for exact filenames and sizes.

## Self-Audit Checklist
- Logo geometry matches ratio 2.3–2.45 and default 1400×600.
- Tracking −15 on wordmark, baseline nudged up 1–2%.
- Side padding inside ellipse 14–16% per side.
- Clear space outside mark 16% of ellipse width and height.
- Colors match tokens and CSS variables.
- Typography uses Montserrat for headings and Inter for body.
- Contrast checks meet or exceed WCAG AA for text.
- Print setup includes navy single-ink and white underbase for yellow.
- Exports include SVG, PDF, PNG 1x 2x 4x, and ICO 32 48 when applicable.
- Figma exports keep text live for SVG masters and outline for print PDFs only.

Flagged TODOs
- Confirm PMS spot swatches on press before wide rollout.
- Capture raster mockups for photo placements that demonstrate the stroke and underlay guidance.
- Package a font license note for League Spartan, Montserrat, and Inter in the repo docs.
