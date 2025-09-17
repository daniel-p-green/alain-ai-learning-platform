/**
 * ALAIN-Kit Outline Generator
 *
 * Generates structured notebook outlines based on analysis of 575 high-quality notebooks.
 * Ensures optimal structure with 6-15 steps, token budgeting, and quality patterns.
 */
export interface OutlineStep {
    step: number;
    title: string;
    type: 'setup' | 'concept' | 'implementation' | 'exercise' | 'deployment';
    estimated_tokens: number;
    content_type: string;
}
export interface NotebookOutline {
    title: string;
    overview: string;
    objectives: string[];
    prerequisites: string[];
    setup: {
        requirements: string[];
        environment: string[];
        commands: string[];
    };
    outline: OutlineStep[];
    exercises: Array<{
        title: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        estimated_tokens: number;
    }>;
    assessments: Array<{
        question: string;
        options: string[];
        correct_index: number;
        explanation: string;
    }>;
    summary: string;
    next_steps: string;
    references: string[];
    estimated_total_tokens: number;
    target_reading_time: string;
}
interface OutlineCustomPrompt {
    title?: string;
    description?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    topics?: string[];
    context?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}
interface OutlineGeneratorOptions {
    baseUrl?: string;
}
interface OutlineGenerationOptions {
    model: string;
    apiKey?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    customPrompt?: OutlineCustomPrompt;
}
export declare class OutlineGenerator {
    private baseUrl?;
    private log;
    constructor(options?: OutlineGeneratorOptions);
    private readonly OPTIMAL_STEP_RANGE;
    private readonly TARGET_TOKEN_RANGE;
    private readonly SECTION_TOKEN_LIMIT;
    private readonly outlineTemplate;
    /**
     * Generate structured outline for a given model/topic
     */
    generateOutline(options: OutlineGenerationOptions): Promise<NotebookOutline>;
    private buildOutlinePrompt;
    private buildRetryOutlinePrompt;
    private parseOutlineResponse;
    private describeAudience;
    private buildSystemPrompt;
    /**
     * Validate outline meets quality standards
     */
    validateOutline(outline: NotebookOutline): {
        isValid: boolean;
        issues: string[];
    };
    private repairOutline;
    private repairOutlineDeterministic;
    private requestWithRetry;
}
export {};
//# sourceMappingURL=outline-generator.d.ts.map