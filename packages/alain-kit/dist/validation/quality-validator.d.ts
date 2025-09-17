/**
 * ALAIN-Kit Quality Validator
 *
 * Validates notebooks against quality standards derived from 575 notebook analysis.
 * Ensures 90+ quality score and adherence to best practices.
 */
export interface QualityMetrics {
    qualityScore: number;
    stepCount: number;
    markdownRatio: number;
    estimatedTokens: number;
    estimatedReadingTime: number;
    hasRequiredSections: boolean;
    meetsStandards: boolean;
}
export declare class QualityValidator {
    private readonly OPTIMAL_STEP_RANGE;
    private readonly OPTIMAL_MARKDOWN_RANGE;
    private readonly TARGET_TOKEN_RANGE;
    private readonly MIN_QUALITY_SCORE;
    /**
     * Validate notebook quality against standards
     */
    validateNotebook(notebookPath: string): QualityMetrics;
    private analyzeNotebook;
    private calculateQualityScore;
    private estimateTokens;
    private calculateReadingTime;
    /**
     * Generate quality report
     */
    generateReport(metrics: QualityMetrics): string;
}
//# sourceMappingURL=quality-validator.d.ts.map