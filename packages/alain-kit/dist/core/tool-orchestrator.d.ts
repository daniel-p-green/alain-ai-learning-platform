import { NotebookOutline } from './outline-generator.js';
import type { SectionGenerationParams, SectionGenerationResult } from './orchestrator.js';
import { NotebookToolController } from './notebook-tool-controller.js';
import { HarmonyStubRuntime } from './tool-runtime.js';
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
export declare class ToolCallingOrchestrator {
    private readonly options;
    private readonly sectionGenerator;
    private readonly log;
    constructor(options: ToolCallingOrchestratorOptions);
    generateSections(params: ToolSectionGenerationParams): Promise<SectionGenerationResult>;
}
export {};
//# sourceMappingURL=tool-orchestrator.d.ts.map