export interface NotebookCell {
    cell_type: 'markdown' | 'code';
    source: string;
}
export interface GeneratedSection {
    section_number: number;
    title: string;
    content: NotebookCell[];
    callouts: Array<{
        type: 'tip' | 'warning' | 'note';
        message: string;
    }>;
    estimated_tokens: number;
    prerequisites_check: string[];
    next_section_hint: string;
}
interface SectionGeneratorOptions {
    baseUrl?: string;
}
interface CustomPromptConfig {
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}
interface SectionGenerationOptions {
    outline: any;
    sectionNumber: number;
    previousSections: GeneratedSection[];
    modelReference: string;
    apiKey?: string;
    customPrompt?: CustomPromptConfig;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
export declare class SectionGenerator {
    private baseUrl?;
    private log;
    constructor(options?: SectionGeneratorOptions);
    private readonly TOKEN_LIMIT;
    private readonly MIN_TOKENS;
    private readonly sectionTemplate;
    /**
     * Generate content for a specific section
     */
    generateSection(options: SectionGenerationOptions): Promise<GeneratedSection>;
    private buildSectionPrompt;
    private parseSectionResponse;
    private trimToJson;
    private sanitizeJsonResponse;
    private extractFirstJsonObject;
    private recordHumanReview;
    private logTrace;
    private appendTrace;
    private postProcessSection;
    private ensureSectionCompleteness;
    private compileFallbackSection;
    private requestWithRetry;
    /**
     * Validate section meets quality standards
     */
    validateSection(section: GeneratedSection): {
        isValid: boolean;
        issues: string[];
    };
    private estimateSectionTokens;
}
export {};
//# sourceMappingURL=section-generator.d.ts.map