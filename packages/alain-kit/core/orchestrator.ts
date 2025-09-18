import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { NotebookOutline } from './outline-generator.js';
import { SectionGenerator, GeneratedSection } from './section-generator.js';
import { HarmonyStubRuntime } from './tool-runtime.js';

export interface SectionGenerationParams {
  outline: NotebookOutline;
  modelReference: string;
  apiKey?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  customPrompt?: {
    title?: string;
    description?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    topics?: string[];
    context?: string;
    modelSpecificInstructions?: string;
    temperature?: number;
    maxTokens?: number;
  };
  maxSections?: number;
  runtime?: HarmonyStubRuntime;
}

export interface SectionGenerationResult {
  sections: GeneratedSection[];
  durations: number[];
  totalDuration: number;
}

/**
 * Legacy orchestrator that still relies on the JSON-based SectionGenerator
 * but routes progress through the tool runtime so the surrounding pipeline
 * can observe structured tool invocations. Extracting this logic prepares
 * the system for a future LLM-driven orchestrator.
 */
export class LegacyNotebookOrchestrator {
  constructor(
    private readonly sectionGenerator: SectionGenerator,
    private readonly checkpointsDir: string,
    private readonly baseUrl?: string
  ) {}

  async generateSections(params: SectionGenerationParams): Promise<SectionGenerationResult> {
    const { outline, modelReference, apiKey, difficulty, customPrompt, runtime } = params;
    const maxSections = Math.min(
      params.maxSections || outline.outline.length,
      outline.outline.length
    );

    const sectionsDir = path.join(this.checkpointsDir, 'sections');
    try { mkdirSync(sectionsDir, { recursive: true }); } catch {}

    const completed = new Set<number>();
    for (const file of (existsSync(sectionsDir) ? readdirSync(sectionsDir) : [])) {
      const match = file.match(/^(\d+)\.json$/);
      if (match) completed.add(Number(match[1]));
    }

    const sections: Array<GeneratedSection | undefined> = new Array(maxSections).fill(undefined);
    const durations: number[] = [];

    for (const idx of Array.from(completed).sort((a, b) => a - b)) {
      if (idx >= 1 && idx <= maxSections) {
        try {
          const record = JSON.parse(readFileSync(path.join(sectionsDir, `${idx}.json`), 'utf8'));
          sections[idx - 1] = record;
        } catch {}
      }
    }

    const isLocal = !!this.baseUrl && (/localhost|127\.0\.0\.1/.test(this.baseUrl));
    const maxConcurrency = Number(process.env.ALAIN_CONCURRENCY || (isLocal ? 2 : 1));
    const tasks: Array<() => Promise<void>> = [];

    for (let index = 0; index < maxSections; index++) {
      const sectionNumber = index + 1;
      if (completed.has(sectionNumber)) continue;
      tasks.push(async () => {
        const execute = async () => {
          const started = Date.now();
          const previousSections = sections
            .slice(0, sectionNumber - 1)
            .filter((section): section is GeneratedSection => !!section);

          runtime?.logInvocation('notebook.generate_section_legacy', {
            sectionNumber,
            previousCount: previousSections.length
          });

          let section: GeneratedSection;
          try {
            section = await this.sectionGenerator.generateSection({
              outline,
              sectionNumber,
              previousSections,
              modelReference,
              apiKey,
              customPrompt,
              difficulty
            });
            runtime?.completeInvocation('notebook.generate_section_legacy', 'ok', {
              sectionNumber,
              markdownCells: section.content.filter(cell => cell.cell_type === 'markdown').length,
              codeCells: section.content.filter(cell => cell.cell_type === 'code').length
            });
          } catch (error) {
            runtime?.completeInvocation('notebook.generate_section_legacy', 'error', {
              sectionNumber,
              message: error instanceof Error ? error.message : String(error)
            });
            throw error;
          }

          const duration = Date.now() - started;
          durations.push(duration);

          runtime?.logInvocation('notebook.section_validation', { sectionNumber });
          const validation = this.sectionGenerator.validateSection(section);
          if (!validation.isValid) {
            runtime?.completeInvocation('notebook.section_validation', 'error', {
              sectionNumber,
              issues: validation.issues
            });
            throw new Error(`Section ${sectionNumber} failed validation: ${validation.issues.join(', ')}`);
          }
          runtime?.completeInvocation('notebook.section_validation', 'ok', {
            sectionNumber,
            estimatedTokens: section.estimated_tokens,
            callouts: section.callouts.length
          });

          sections[sectionNumber - 1] = section;
          try {
            writeFileSync(
              path.join(sectionsDir, `${sectionNumber}.json`),
              JSON.stringify(section, null, 2)
            );
          } catch {}
        };

        await this.attemptWithBackoff(execute, 5);
      });
    }

    const started = Date.now();
    await this.runPool(tasks, maxConcurrency);
    const totalDuration = Date.now() - started;

    const orderedSections = sections.slice(0, maxSections);
    const missing = orderedSections
      .map((section, idx) => (section ? null : idx + 1))
      .filter((value): value is number => value !== null);
    if (missing.length > 0) {
      throw new Error(`Section generation incomplete. Missing sections: ${missing.join(', ')}`);
    }

    return {
      sections: orderedSections as GeneratedSection[],
      durations,
      totalDuration
    };
  }

  private async runPool(tasks: Array<() => Promise<void>>, limit: number): Promise<void> {
    const queue = tasks.slice();
    const workers = Array.from({ length: Math.min(Math.max(1, limit), queue.length || 1) }, async () => {
      while (queue.length) {
        const task = queue.shift();
        if (!task) break;
        await task();
      }
    });
    await Promise.all(workers);
  }

  private async attemptWithBackoff(fn: () => Promise<void>, retries: number): Promise<void> {
    let attempt = 0;
    let delay = 500;
    while (true) {
      try {
        await fn();
        return;
      } catch (error) {
        attempt++;
        if (attempt > retries) throw error;
        const jitter = Math.round(delay * (0.8 + Math.random() * 0.4));
        await new Promise(resolve => setTimeout(resolve, jitter));
        delay = Math.min(5000, delay * 2);
      }
    }
  }
}
