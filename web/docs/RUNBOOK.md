# ALAIN Demo Runbook (Web + Encore)

This runbook verifies a complete demo path with streaming.

## Prerequisites
- Backend (Encore) running with SSE endpoints:
  - `POST /execute` (non-streaming)
  - `POST /execute/stream` (SSE streaming)
- Web app running (Next.js App Router)
- Clerk configured for both web and backend. Ensure `CLERK_JWT_ISSUER` on backend matches your Clerk instance.

## Env Vars
- In `web/.env.local`:
  - `NEXT_PUBLIC_BACKEND_BASE=http://localhost:4000`
  - `NEXT_PUBLIC_STREAM_VIA=backend` (to proxy SSE from backend) or `web` (default provider-direct streaming)
  - `NEXT_PUBLIC_EXECUTE_RPM=30` (optional rate limit)

## Steps
1) Sign in via the web app.
2) Open Notebooks: `/notebooks`
   - Verify catalog loads and filters operate.
   - Open a tutorial and confirm layout uses ALAIN tokens and surfaces.
3) Open Stream demo: `/stream` (or any page that streams via `/api/execute`).
   - Start a streaming request.
   - Confirm tokens forward:
     - If `NEXT_PUBLIC_STREAM_VIA=backend`, the web proxies to `POST /execute/stream` with Clerk JWT in `Authorization`.
     - If `NEXT_PUBLIC_STREAM_VIA=web`, the web streams from configured providers directly.
   - Cancel streaming with AbortController if supported by the page.
4) Settings: `/settings`
   - Run Setup Wizard actions (Offline/Hosted), re-check probes, and validate providers.
5) LM Studio: `/lmstudio`
   - Run a search, load options, and simulate a download.

## Expected Results
- Streaming emits incremental tokens and ends with `[DONE]` or final JSON.
- Visible focus rings on all interactive controls.
- Body text contrast at AA or higher.
- CTAs use `alain-yellow` with `alain-blue` text only.

## Troubleshooting
- 401 Unauthorized: ensure Clerk JWT forwarding is enabled and backend verifies it.
- CORS errors: allow `web` origin in backend CORS policy.
- No streaming: confirm Encore endpoint `/execute/stream` is up; switch `NEXT_PUBLIC_STREAM_VIA` to `web` as a fallback.
- Rate limited: lower `NEXT_PUBLIC_EXECUTE_RPM` or wait for window to reset.

## Note
- UI routes are served under `/notebooks`.
- Legacy `/tutorials` pages re-export to notebooks; you can update external links at your convenience.
