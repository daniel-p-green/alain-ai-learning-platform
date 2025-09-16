# Web (Next.js App Router + Clerk)

- Install deps: `npm install`
- Create `.env.local` with your Clerk keys (from Clerk Dashboard > API keys):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

- Run dev server: `npm run dev`

This app uses `clerkMiddleware()` in `middleware.ts` and wraps the App Router layout in `<ClerkProvider>`.

## Tests

- Unit tests (Vitest): `npm run test`
- E2E tests (Playwright): `npm run test:e2e`
  - First time: `npx playwright install --with-deps`
  - CI runs on pushes/PRs touching `web/**` via `.github/workflows/web-tests.yml`
  - PRs run smoke E2E (home + footer). `main` runs the full E2E suite.
  - On failure, Playwright HTML report is uploaded as an artifact.

Included E2E checks:
- `home.spec.ts` — home page renders with CTAs
- `generate.spec.ts` — generate page shows inputs
- `footer.spec.ts` — footer shows attribution links and no legacy links (Blueprint/Phases/Settings)
