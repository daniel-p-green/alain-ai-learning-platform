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
export declare class LegacyNotebookOrchestrator {
    private readonly sectionGenerator;
    private readonly checkpointsDir;
    private readonly baseUrl?;
    constructor(sectionGenerator: SectionGenerator, checkpointsDir: string, baseUrl?: string);
    generateSections(params: SectionGenerationParams): Promise<SectionGenerationResult>;
    private runPool;
    private attemptWithBackoff;
}
//# sourceMappingURL=orchestrator.d.ts.map