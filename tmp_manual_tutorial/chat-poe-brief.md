# Tutorial Brief: Build an AI Chat Interface with Poe Model Selector

## Audience
- Front-end engineers comfortable with React 18, TypeScript, and Next.js routing
- Product-minded builders shipping internal tooling or enablement docs
- Basic familiarity with OpenAI-compatible APIs; new to Poe-specific nuances

## Scope
- Deliver a runnable Next.js + TypeScript tutorial notebook that walks through:
  1. Project setup (Next.js app, env vars, Poe API wiring)
  2. Building a model selector UI for ten Poe-hosted chat models
  3. Implementing a streaming chat interface with server actions/handlers
  4. Capturing telemetry (request timing, token counts, fallback events)
  5. Testing flows (unit smoke + manual checks)
  6. Packaging and wrap-up with deployment tips

## Success Criteria
- Markdown narrative explains rationale, trade-offs, and Poe-specific configuration
- Code cells contain complete, runnable snippets with imports and type definitions
- Demonstrates model switching, streaming responses, and telemetry logging
- No placeholders—env var names, URLs, component props are concrete
- Includes QA checklist coverage: callouts, markdown/code balance, tests, and summary metadata

## Constraints & Assumptions
- Use Next.js App Router with React Server Components where sensible
- Poe API called through `openai` SDK configured with `base_url="https://api.poe.com/v1"`
- Ten models drawn from current Poe catalog (OSS + flagship)
- Telemetry stored client-side for tutorial simplicity (no external DB)
- Expect readers to run locally with `npm` or `pnpm`

## Deliverables
- Outline JSON with step-by-step structure (intro → setup → selector → chat → telemetry → testing → wrap-up)
- Section markdown & TypeScript code ready for colocation inside `.ipynb`
- QA summary noting tests executed and outstanding risks
