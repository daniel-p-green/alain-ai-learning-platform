import { NotebookOutline } from './outline-generator.js';
import { SectionGenerator, GeneratedSection } from './section-generator.js';
import type { SectionGenerationParams, SectionGenerationResult } from './orchestrator.js';
import { NotebookToolController } from './notebook-tool-controller.js';
import { HarmonyStubRuntime } from './tool-runtime.js';
import { createLogger } from './obs.js';

interface ToolCallingOrchestratorOptions {
  model: string;
  apiKey: string;
  baseUrl?: string;
}

interface ToolSectionGenerationParams {
  outline: NotebookOutline;
  modelReference: string;
  difficulty: SectionGenerationParams['difficulty'];
  customPrompt?: SectionGenerationParams['customPrompt'];
  apiKey?: string;
  maxSections?: number;
  runtime?: HarmonyStubRuntime;
  notebookController: NotebookToolController;
}

const TOOL_INVOCATION = 'notebook.generate_section_tool';

export class ToolCallingOrchestrator {
  private readonly sectionGenerator: SectionGenerator;
  private readonly log = createLogger('ToolCallingOrchestrator');

  constructor(private readonly options: ToolCallingOrchestratorOptions) {
    this.sectionGenerator = new SectionGenerator({ baseUrl: options.baseUrl });
  }

  async generateSections(params: ToolSectionGenerationParams): Promise<SectionGenerationResult> {
    const {
      outline,
      modelReference,
      difficulty,
      customPrompt,
      apiKey,
      maxSections,
      runtime,
      notebookController,
    } = params;

    const totalSections = outline.outline?.length ?? 0;
    const sectionTarget = Math.min(maxSections ?? totalSections, totalSections);
    if (sectionTarget <= 0) {
      throw new Error('Outline contains no sections to generate');
    }

    const resolvedSections: GeneratedSection[] = [];
    const durations: number[] = [];

    for (let index = 0; index < sectionTarget; index++) {
      const sectionNumber = index + 1;
      const previousSections = resolvedSections.slice();
      runtime?.logInvocation?.(TOOL_INVOCATION, {
        sectionNumber,
        previousCount: previousSections.length,
      });

      const started = Date.now();
      try {
        const section = await this.sectionGenerator.generateSection({
          outline,
          sectionNumber,
          previousSections,
          modelReference,
          apiKey: apiKey ?? this.options.apiKey,
          customPrompt,
          difficulty,
        });
        durations.push(Date.now() - started);
        resolvedSections.push(section);
        notebookController.registerSection(section);
        runtime?.completeInvocation?.(TOOL_INVOCATION, 'ok', {
          sectionNumber,
          markdownCells: section.content.filter((cell) => cell.cell_type === 'markdown').length,
          codeCells: section.content.filter((cell) => cell.cell_type === 'code').length,
        });
      } catch (error) {
        runtime?.completeInvocation?.(TOOL_INVOCATION, 'error', {
          sectionNumber,
          message: error instanceof Error ? error.message : String(error),
        });
        this.log.error('tool_section_failed', {
          sectionNumber,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    const totalDuration = durations.reduce((acc, value) => acc + value, 0);
    return {
      sections: resolvedSections,
      durations,
      totalDuration,
    };
  }
}

