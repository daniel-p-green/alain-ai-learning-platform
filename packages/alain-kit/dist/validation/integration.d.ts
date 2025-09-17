/**
 * ALAIN-Kit Integration
 *
 * Main entry point that orchestrates outline generation, section filling,
 * notebook building, and validation in a single pipeline.
 */
import { NotebookOutline } from '../core/outline-generator.js';
import { GeneratedSection } from '../core/section-generator.js';
import { QualityMetrics } from './quality-validator.js';
import { ColabValidationResult } from './colab-validator.js';
import { QaGateReport } from './qa-gate.js';
import { SemanticReport } from './semantic-validator.js';
export interface ALAINKitResult {
    success: boolean;
    qualityScore: number;
    colabCompatible: boolean;
    notebook: any;
    outline: NotebookOutline;
    sections: GeneratedSection[];
    qualityMetrics: QualityMetrics;
    colabValidation: ColabValidationResult;
    qaReport: QaGateReport;
    semanticReport: SemanticReport;
    validationReport: string;
    phaseTimings?: {
        outline_ms: number;
        sections_ms_total: number;
        section_ms: number[];
        build_ms: number;
        quality_ms: number;
        colab_ms: number;
        total_ms: number;
    };
}
export declare class ALAINKit {
    private outlineGenerator;
    private sectionGenerator;
    private notebookBuilder;
    private qualityValidator;
    private colabValidator;
    private qaGate;
    private semanticValidator;
    private baseUrl?;
    private checkpointsDir;
    constructor(options?: {
        baseUrl?: string;
    });
    /**
     * Generate complete notebook with validation
     */
    generateNotebook(config: {
        modelReference: string;
        apiKey?: string;
        difficulty?: 'beginner' | 'intermediate' | 'advanced';
        maxSections?: number;
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
    }): Promise<ALAINKitResult>;
    private generateValidationReport;
    private runPool;
    private attemptWithBackoff;
}
/**
 * Simple usage example
 */
export declare function generateNotebook(options: {
    modelReference: string;
    apiKey?: string;
    baseUrl?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    maxSections?: number;
    customPrompt?: {
        title: string;
        description: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        topics: string[];
        modelSpecificInstructions?: string;
    };
}): Promise<ALAINKitResult>;
//# sourceMappingURL=integration.d.ts.map