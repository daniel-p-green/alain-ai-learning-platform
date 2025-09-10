# ALAIN — The Assembly Instructions for AI Models

## What it does
**Every AI model comes with raw intelligence. ALAIN provides the assembly instructions.**

Like IKEA transforms furniture parts into usable products with clear instructions, ALAIN transforms AI model cards into step-by-step tutorials. Paste any Hugging Face URL → get runnable lessons with code examples, cost estimates, and interactive assessments.

**Before**: Model card → hours of confusion → maybe working code  
**After**: Model URL → 2 minutes → production-ready tutorial

New:
- Adapt Experience (beta): tailor complexity for Beginner/Intermediate/Advanced  
- Public Gallery: community-shared tutorials with search and filters

## Why GPT-OSS: The Perfect Instruction Writer
- **Philosophical**: Open models creating instructions for other open models - transparency all the way down, just like IKEA's clear assembly process.
- **Technical Sweet Spot**: GPT-OSS 20B delivers pedagogical reasoning needed for quality tutorials while remaining efficient enough for local "assembly workshops" (Ollama/vLLM).
- **Local Assembly**: Complete offline instruction generation - your private AI workshop with no cloud dependencies.
- **Future-Proof**: Open weights enable fine-tuning ALAIN's teacher specifically for educational content, creating increasingly better "instruction manuals" over time.

## How we built it: The Assembly Line
- **Frontend**: Next.js workshop interface with Monaco Editor - clean space for following instructions
- **Backend**: Encore.ts instruction generation factory - parsing model cards and creating step-by-step guides  
- **Teacher**: GPT-OSS 20B as our expert instruction writer, generating pedagogically sound tutorials
- **Quality Control**: JSON schema validation + auto-repair - ensuring every instruction set works perfectly
- **Multi-Provider**: Poe (hosted factory) and OpenAI-compatible (local workshop) - use your preferred tools

## Judge Validation: Real Market Need ✓
Our live demo resonated with judges who immediately saw the value:
- **"I was actually looking for this"** - validates the core problem exists
- **"Perfect for localized languages"** - identified global impact for non-English models  
- **"Are we using the best model?"** - confirmed enterprise value for rapid model evaluation

## Local Assembly Workshop (Ollama)
Set up your private AI instruction factory:

1) **Get your instruction writer**
```
ollama pull gpt-oss:20b
```
2) **Configure your local workshop**
```
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_API_KEY=ollama
```
3) **Start the assembly line**
```
npm run dev:backend
npm run dev:web
```
4) **Generate instructions**: Teacher Provider → Local → paste any HF model URL → watch instructions being created

## Known Limitations
- Streaming: Implemented in the Next.js layer only; Encore streaming disabled in MVP.
- Reasoning visibility: Harmony‑style prompting used for the teacher, but internal reasoning is surfaced only as an optional summary in the Generate view (beta).
- Tools/function calling: Minimal scaffold behind `TEACHER_ENABLE_TOOLS`; disabled by default to avoid provider incompatibilities.
- Backend auth & rate limits: generation/execution require auth with per-user limits; Colab export lightly throttled.

## Challenges
- Provider divergence and alias drift (solved with a shared alias map and tests).
- Strict validation vs. demo speed (balanced via a single repair pass and clear error surfacing).

## What's next: Building the Global AI Workshop
- **Specialized Instructions**: Fine-tuned GPT-OSS models for domain-specific assembly guides (code, research, creative)
- **Community Gallery**: Marketplace for sharing and improving instruction sets, with quality ratings
- **Enterprise Workshops**: Private instruction libraries for companies evaluating multiple models
- **Multi-Language Support**: Starting with Urdu (as our judge suggested) - making AI accessible globally

## The IKEA Effect for AI
Just like IKEA democratized good design by providing clear assembly instructions, ALAIN democratizes AI expertise by providing clear implementation instructions. Every model gets the documentation it deserves. Every developer gets the guidance they need.

**From raw intelligence to real implementation. That's the ALAIN way.**
