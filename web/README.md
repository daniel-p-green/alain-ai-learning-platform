# Web (Next.js App Router + Clerk)

- Install deps: `npm install`
- Create `.env.local` with your Clerk keys (from Clerk Dashboard > API keys):

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
CLERK_SECRET_KEY=YOUR_SECRET_KEY
```

- Run dev server: `npm run dev`

This app uses `clerkMiddleware()` in `middleware.ts` and wraps the App Router layout in `<ClerkProvider>`.
