import { NotebookOutline } from '../core/outline-generator.js';
import { GeneratedSection } from '../core/section-generator.js';
export type SemanticStatus = 'pass' | 'warn' | 'fail';
export interface SemanticReport {
    status: SemanticStatus;
    issues: string[];
    fillerSections: string[];
    recommendations: string[];
    rawResponse: string;
}
interface EvaluateParams {
    outline: NotebookOutline;
    sections: GeneratedSection[];
    notebook: any;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}
export declare class SemanticValidator {
    private readonly log;
    evaluate(params: EvaluateParams): Promise<SemanticReport>;
    private buildPrompt;
    private parseResponse;
    private normalizeReport;
}
export {};
//# sourceMappingURL=semantic-validator.d.ts.map