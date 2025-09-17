# ALAIN Web App Page Copy & UX Reference

Authoritative inventory of the current customer-facing copy and a quick UX narration for every route under `apps/web/app/`. Text shown in braces `{}` is populated dynamically.

## Home (`/`)

- **Primary copy**
  - Eyebrow: `Applied Learning for AI`
  - Hero headline: `AI Manuals for AI Models`
  - Subhead: `Paste a Hugging Face link or pick a local model. Generate a step‑by‑step manual with runnable code, checks, and clean exports.`
  - Primary CTA: `Generate Manual` → `/generate`
  - Secondary CTA: `Library` → `/notebooks`
- **Supporting copy**
  - Promo card heading: `Why ALAIN`
  - Value bullets: `• Build real skills with hands-on steps and checks`, `• Use one request shape across hosted and local providers`, `• Export clean notebooks with no embedded secrets`
  - “How it works” steps: `1. Paste a model link`, `2. Generate a manual`, `3. Run and export`
  - Audience cards: `For teams`, `For educators`, `For builders`
- **Experience overview**: Visitors land on a lightweight hero focused on the value promise, see two clear CTAs, then scroll through three-step onboarding guidance and persona-specific cards that explain fit. No forms, just static marketing copy.

## Generate (`/generate`)

- **Primary copy**
  - Page title: `Generate Manual`
  - Supporting line: `Recommended defaults. Works offline or hosted. Export to Jupyter/Colab.`
- Example buttons: `Use Example (Hosted)`, `Use Example (Local: gpt-oss-20b)`
- Guided wizard CTA: `Open Guided Wizard` (drawer overlay)
  - Source toggle labels: `From Hugging Face`, `From Local Runtime`, `From Text`
  - Research module: `Research mode` with buttons `Standard`, `Thorough`, optional `Web-only`
  - Fallback hint (flagged by env): `Force fallback mode (no backend) for From Text. Helpful on Vercel. Only From Text is supported in fallback.`
  - Field labels: `Paste text`, `Local model`, `Target provider/model`, `Difficulty`, `Teacher`, `Teacher model`
  - Submit button: `Generate`
  - Snackbar messages: `Manual ready! Open it or export to Colab.`, `Generating…`, `Repaired and imported successfully`
  - Error text: `Setup needed`, validation errors such as `Select or enter a local model id`, `Enter a valid Hugging Face URL or org/model (owner/repo)`
  - Auto-fix modal copy: checkboxes `add_description`, `add_intro_step`, `compact_steps`, action button `Auto-fix and Import`
- **Supporting copy**
  - Environmental banner: `Env: {Offline|Hosted} · Provider: {provider} · Base URL: {url}` and hints like `Use Settings → Environment Status...`
  - Research notes (per mode): e.g. `Fetches model info... (~2–6s)`, `Adds reasoning summary... (~5–12s)`
  - Local runtime helper: `No local models detected`, `Use Hosted (Poe)...`, `Open Explorer`
  - HF quick-pick buttons rendered with model ids
  - Preview panel headings: `Preview`, `Model Maker`, `Objectives`, `Step 1: {title}` plus buttons `Open Manual`, `Export Notebook`, `Download JSON`
- **Experience overview**: Page opens with context about default environment. Users can launch the guided wizard (three-step drawer with hosted/local/Colab presets and hardware guidance) or stay in the advanced form. The form lets them choose data source (HF, local, or pasted text), optionally adjust research depth and teacher/target settings, then submit. Success reveals the PreviewPanel with open/export actions. Errors present inline banner plus optional auto-fix workflow. Snackbar pulses confirm progress. Example buttons prefill and auto-submit for demos.
- **Notable states**: Environment probe call may surface readiness message; provider/model lists hydrate asynchronously; fallback UI gated by `NEXT_PUBLIC_ENABLE_FALLBACK_UI`.

## Outline-First Generator (`/generate/outline-first`)

- **Primary copy**
  - Header: `ALAIN‑Kit — Outline‑First Notebook Generator`
  - Field labels: `Model`, `Difficulty`, `Max Sections`
  - Action buttons: `Start`, `Stop`, `Download .ipynb`, `Download Bundle (.zip)`
  - Section list heading: `Sections`
  - Activity feed heading: `Activity`
  - Inline messages like `Starting generation (model=...)`, `Outline ready (...)`, `Notebook ready.`, `Stopped by user.`
- **Experience overview**: Power users stream notebook generation via SSE. They set parameters, click Start, watch live status and section checklist update, and optionally download outputs. Errors append to activity log.

## LM Studio Explorer (`/lmstudio`)

- **Primary copy**
  - Header: `LM Studio Model Explorer`
  - Subhead: `Search curated models, view quantization options, and download locally via LM Studio.`
  - Search placeholder: `Search term (e.g. llama-3)`
  - Buttons: `Search`, `Options`, `Download`, fallback `Use in Generate`
  - Empty states: `No results.`, `Loading options…`
  - SDK warning card: `SDK not available or LM Studio not running` with bullet instructions and `Back to Generate` link
  - Identifier card text: `Model identifier:`, `Use this identifier with provider lmstudio...`
- **Experience overview**: Page checks LM Studio availability, shows search → select → download workflow. If SDK missing, it instructs user how to enable the local server and surfaces any detected local models as a fallback path.

## Research (`/research`)

- **Primary copy**
  - Header: `Research Models`
  - Subtext: `Run research-only analysis and save findings under resources/content/research/<provider>/<model>/`
  - Form labels: `Hugging Face Model (owner/repo or URL)`, `Depth`, `Download offline cache (HF/Unsloth/Cookbook)`
  - Submit button: `Run Research`
  - Error banner: `Request failed` style messages
  - Summary card fields: `Parameters`, `Context`, `Quantization`, `Tasks`, `Benchmarks`, `Suggested`, `Saved under`
  - CTA links: `Generate from this model`, `Download summary JSON`
  - Artifacts section: `Artifacts`, buttons per file name with `download` links
- **Experience overview**: Users paste an HF ref, choose depth/offline cache, and run research. Successful runs show a summary card plus artifact browser. They can jump straight into generation or save JSONs. Errors halt submission and display inline banners.

## Stream Demo (`/stream`)

- **Primary copy**
  - Header: `Streaming Demo`
  - Subtext: `Runs a small prompt and streams the model output in real time.`
  - Signed-out message: `Please sign in to run the demo.`
  - Buttons: `Run`, `Clear`
  - Streaming metrics labels inside component: `Elapsed`, `Tokens`, status text `Streaming…`
  - Error copy surfaces via `Request failed` etc.
- **Experience overview**: Authenticated users trigger a sample call that streams deltas into the console. A timer and token estimate update live, and the output area reflects success/error states. Signed-out users see a sign-in prompt.

## Notebooks Library (`/notebooks`)

- **Primary copy**
  - Header: `Notebooks`
  - Top CTA: `Featured`
  - Filters: `Model ID`, `Provider` select (Any/Poe/OpenAI-compatible/LM Studio/Ollama), difficulty select (Any/Beginner/Intermediate/Advanced), `Tag`
  - Helper text clarifies you can leave Model ID blank, maps providers (hosted Poe vs OpenAI-compatible/local), and notes tags match notebook metadata.
  - Buttons: `Apply Filters`, `Reset`
  - Card text: `{model} · {provider} · {DIFFICULTY}` plus `Download` button
  - Empty state: `No notebooks found. Adjust filters.`
- **Experience overview**: Users scan a filterable list of stored notebooks, refine results using simple inputs, then download assets. Featured link jumps to curated view.

## Featured Notebooks (`/notebooks/featured`)

- **Primary copy**
  - Header: `Featured Notebooks (GitHub)`
  - Demo guide heading: `Demo guide: Remix → Export PR`
  - Step bullets (Open a featured notebook... Export ALAIN (PR)...) with prerequisite note referencing environment variables.
  - List actions: `Open`, `Remix`
  - Footer block: `Open any GitHub .ipynb`
- **Experience overview**: Page orients demo hosts with a step-by-step script, then lists curated GitHub notebooks with quick access to view or remix. Includes form to open arbitrary GitHub files.

## Notebook Detail (`/notebooks/[id]`)

- **Primary copy**
  - Dynamic title: `{Notebook Title}`
  - Metadata line: `{sourceType} • {sourceOrg?} + Teacher badge` (either `Teacher: 120B` or `Teacher: 20B`)
  - Optional link: `View commit`
  - Meta footer: `License: {license}` and `Source`
  - Action buttons: `Edit`, `Remix`, `Remix (Full ALAIN)`, `Export ALAIN (PR)`, `Request Publish`, conditional `Add to Library`
  - Toasts: `Exporting ALAIN (PR)…`, `PR opened: {url}`, `Remixing…`, `Remix ready`, `Export failed`, etc.
  - Remix modal copy: `Remix with ALAIN`, checkboxes (Objectives, Knowledge Checks, Try It Yourself, Pro Tips, Key Takeaways), `Apply Remix`
  - Full-flow modal: `Remix with Full ALAIN Flow`, field labels (`Provider Base URL`, `Model`, `Max Sections`), note `Uses Outline → Sections → Build...`
- **Experience overview**: Detail screen combines a quick metadata summary, full notebook viewer, and a suite of actions (edit, remix variations, export). Modal workflows handle remix flows; success routes users to the new notebook.

## Notebook Editor (`/notebooks/[id]/edit`)

- **Primary copy**
  - Header: `Edit Notebook`
  - Subtext: `Notebook ID: {id}`
  - Error message: `Failed to load notebook`
  - Controls: `Editor theme`, options `Dark`, `Light`
  - Metadata fields: `Title`, `Source Type`, `Org`, `Tags (comma)`, `License`, `Provenance URL`, checkbox `Publish`
  - Cell actions: `Cell {n} — {markdown|code}`, buttons `↑`, `↓`, `Remove`, `Add Markdown`, `Add Code`
  - Advanced toggle: `Advanced: Edit raw JSON`
  - Footer buttons: `Save`, `Cancel`
  - Save toast via navigation (errors shown inline)
- **Experience overview**: Admins edit notebook metadata and cells in-place. Source JSON is editable via collapsible panel. On save, notebook PUTs to admin API and routes back to detail view (with optional commit link).

## Lessons Catalog (`/lessons`)

- **Primary copy**
  - Header: `Lessons`
  - Filters: `Model ID`, `Provider` select (Any/Poe/OpenAI-compatible/LM Studio/Ollama), difficulty select, `Tag`
  - Helper text mirrors the notebook view so users know provider names correspond to runtimes.
  - Buttons: `Apply Filters`, `Reset`
  - Card info: same trio `model · provider · DIFFICULTY`, path line, optional `Tags:` row
  - Empty state: `No lessons found. Adjust filters.`
- **Experience overview**: Mirrors notebook catalog but for lesson JSON assets—read-only list with filtering and plain metadata.

## Tutorial Detail (`/tutorials/[id]`)

- **Primary copy**
  - Title: `{Tutorial title}`
  - Metadata chip line: `{model} · {provider} · {DIFFICULTY} · {timestamp}`
  - Description block: manual description text
  - Model maker card: `Model Maker`, `Homepage`, `Repo`, `License`
  - Progress widget: `Progress: {done}/{total} steps ({pct}%)`
  - Step blocks: `{n}. {Step title}`, optional `Expected: {expected_output}`
  - Buttons: `Mark complete` via `MarkCompleteButton`
  - Footer tool: `TryPrompt`
- **Experience overview**: Learners walk step-by-step through generated manual steps, optionally running inline code with `StepRunner`, tracking progress, and checking knowledge via assessments. End-of-flow prompt playground encourages experimentation.

## Onboarding Wizard (`/onboarding`)

- **Step 1 copy**
  - Title: `Welcome to ALAIN`
  - Subtitle: `Paste a model. Get a manual. Run and reuse.`
  - Body reassurance: `We keep your keys on your device. We never send keys to our servers.`
  - Buttons: `Get started`, `Skip for now`
- **Step 2 copy**
  - Title: `Choose model providers`
  - Subtitle: `Select providers you plan to use and add credentials.`
  - Each provider card repeats `We never send keys to our servers. Keys stay on your device.` plus field labels `API key`, `Base URL`, button `Test connection` / `Tested ✓`
- **Step 3 copy**
  - Title: `Choose a model`
  - Subtitle: `Paste a model URL or ID.` with helper `Paste a full Hugging Face URL or a model ID.`
- **Step 4 copy**
  - Title: `Choose run mode`
  - Subtitle: `Use cloud or local runtimes.`
  - Local hints: `Download a model and start the local server on port 1234.` / `Install Ollama and run ollama serve...`
  - Checkbox: `Cache assets for offline use`
- **Step 5 copy**
  - Title: `Review and finish`
  - Subtitle: `Confirm your selections.`
  - Summary cards: `Providers`, `Model`, `Run mode`
  - Final button: `Finish`
- **Experience overview**: Five-step flow persisting settings. Users can skip, go back, or review. Warnings emphasize key security messages and provide guidance for local runtime setup.

## System Health (`/health`)

- **Primary copy**
  - Header: `System Health`
  - Status badges: `Offline` / `Hosted: {provider}`, `Poe key: configured|missing`, `Base URL: present|n/a`
  - Button: `Run provider tests`
  - Summary text e.g. `{pass} OK · {fail} error — {hint}`
  - Local runtime section: `Local Runtime`, `Provider:`, `Base:`
  - Error message: `Loading…` or inline red banner
- **Experience overview**: Ops dashboard shows environment detection, service status tiles, and local model availability. Users can trigger smoke tests and read back quick results.

## Admin Upload (`/admin`)

- **Primary copy**
  - Header: `Admin: Upload Notebook`
  - Form labels: `Notebook (.ipynb)`, `Title`, `Source Type`, `Source Org (optional)`, `Tags (comma-separated)`, `License`, `Provenance URL`, checkbox `Publish`
  - Error message: `Choose a .ipynb file` or upload errors
  - Submit button: `Upload` (loading state `Uploading…`)
- **Experience overview**: Admins upload notebooks with metadata, then on success redirect to detail screen (optionally carrying commit URL). Form enforces file selection before submission.

## Moderation Queue (`/admin/moderation`)

- **Primary copy**
  - Header: `Moderation Queue`
  - Card layout: Title fallback to id, subtitle `id • {sourceOrg}`
  - Buttons: `Reject`, `Approve`
  - Empty state: `No pending notebooks.`
- **Experience overview**: Admins review pending notebooks, approve/reject with inline buttons, and see real-time removal from queue. Errors display inline in red text.

## My Notebooks (`/my/notebooks`)

- **Primary behavior**: Immediate redirect to `/notebooks` (no on-screen copy).
- **Experience overview**: Alias route ensures legacy links land on the shared library view.
