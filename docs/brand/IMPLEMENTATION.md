# Brand Implementation (Assembly-Inspired)

This project uses a simple, distinctive brand system designed to feel like clear assembly instructions — universal, legible, and friendly. This doc describes the minimal primitives and how to use them consistently across the app.

## Color Tokens

Tailwind is the source of truth. CSS variables mirror the same values for non‑Tailwind surfaces.

- `brand.blue`: Primary action/links (AA/AAA on white)
- `brand.yellow`: Accent (CTA highlight) used with dark ink text
- `ink`: Default text/outline on light backgrounds
- `paper`: Default light background

Tailwind config: `web/tailwind.config.ts`
```ts
extend: {
  colors: {
    brand: { blue: '#0057AD', yellow: '#FBDA0C' },
    ink: '#111827',
    paper: '#FFFFFF',
  },
  borderRadius: { brand: '12px', tab: '10px' },
}
```

CSS variables (mirrors): `web/app/globals.css`
```css
:root {
  --brand-blue: #0057AD;
  --brand-yellow: #FBDA0C;
  --paper: #FFFFFF;
  --ink: #111827;
}
```

Accessibility
- brand blue on white ≈ 8.2:1 (AAA)
- white on brand blue ≈ 4.6:1 (AA)
- brand yellow with ink ≈ 7.8:1 (AA/AAA for text)

## Typography

- Display: League Spartan 700/900 (loaded via Google Fonts import in `globals.css`)
- UI: Inter (system UI stack fallback)

Usage examples
```tsx
<h1 className="font-display font-black">Heading</h1>
<p className="font-sans">Body text</p>
```

## Buttons (Shared)

Use the shared component for all actions: `web/components/Button.tsx`

Variants
- `primary`: `bg-brand-blue text-white`
- `accent`: `bg-brand-yellow text-ink border border-ink`
- `secondary`: `bg-gray-800 text-white border border-gray-700`
- `danger`: `bg-red-600 text-white`

Examples
```tsx
<Button>Primary</Button>
<Button variant="accent">Accent</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Danger</Button>
```

## Navigation & Titles

- Links: `text-brand-blue hover:underline`
- Active tabs/pills: use `rounded-brand` radius
- Step navigation: active = primary, inactive = secondary, show step titles when available

## Streaming Output Status

Component: `web/components/StreamingOutput.tsx`

- Pass `status`: `error | success | info | idle` to apply status border color
```tsx
<StreamingOutput status="info" ... />
```

## CORS & Env Vars

- Backend services expose CORS for browser calls. Set `WEB_ORIGIN` in production; defaults to `http://localhost:3000`.
- Web calls backend via `NEXT_PUBLIC_BACKEND_BASE` (defaults to `http://localhost:4000`).
- Provider credentials: set `POE_API_KEY` or `OPENAI_BASE_URL` + `OPENAI_API_KEY` for execution.

## Naming & Guardrails

- Use neutral, brand‑agnostic names (`brand.*`).
- Avoid external brand names/lockups in class names or tokens.
- Keep color use restrained: blue for primary actions/links; yellow sparingly for accents with dark text.

