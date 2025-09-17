/**
 * ALAIN-Kit Colab Validator
 *
 * Detects and fixes Google Colab compatibility issues automatically.
 * Prevents common errors before notebooks reach users.
 */
export interface ColabIssue {
    type: string;
    severity: 'critical' | 'warning';
    description: string;
    cellIndex: number;
    autoFixable: boolean;
}
export interface ColabValidationResult {
    isCompatible: boolean;
    issues: ColabIssue[];
    fixedNotebook?: any;
}
export declare class ColabValidator {
    private readonly ERROR_PATTERNS;
    private readonly reviewConfig;
    constructor();
    /**
     * Validate notebook for Colab compatibility
     */
    validateNotebook(notebookPath: string): Promise<ColabValidationResult>;
    private detectIssues;
    private applyFixes;
    private toNotebookSource;
    private requestModelReview;
    /**
     * Generate compatibility report
     */
    generateReport(result: ColabValidationResult): string;
}
//# sourceMappingURL=colab-validator.d.ts.map