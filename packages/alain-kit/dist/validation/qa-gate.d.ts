import { NotebookOutline } from '../core/outline-generator.js';
import { GeneratedSection } from '../core/section-generator.js';
export type QaGateStatus = 'pass' | 'warn' | 'fail';
/**
 * Provides lightweight structural checks before running the expensive
 * validation suite. The implementation is intentionally small and
 * deterministic so it is easy to reason about and extend.
 */
export interface QaGateReport {
    notebook_title: string;
    qa_timestamp: string;
    overall_status: QaGateStatus;
    summary: string;
    metrics: {
        outline_steps: number;
        sections_expected: number;
        sections_received: number;
        objectives_in_outline: number;
        exercises_count: number;
        assessments_count: number;
        avg_section_length_chars: number;
        markdown_ratio_estimate: number;
    };
    quality_gates: {
        outline_completeness: {
            status: QaGateStatus;
            notes: string[];
        };
        section_alignment: {
            status: QaGateStatus;
            notes: string[];
        };
        placeholder_scan: {
            status: QaGateStatus;
            notes: string[];
        };
    };
    blocking_issues: string[];
    warning_issues: string[];
    recommended_actions: {
        must_fix: string[];
        should_fix: string[];
    };
    automation_hooks: {
        regex_checks: string[];
    };
    source_trace: {
        outline_reference: string;
        section_ids: string[];
    };
}
interface QaGateInput {
    outline: NotebookOutline;
    sections: GeneratedSection[];
    notebook?: any;
}
export declare class QaGate {
    private readonly log;
    evaluate({ outline, sections }: QaGateInput): Promise<QaGateReport>;
    private inspectSections;
    private scanPlaceholders;
    private statusFor;
    private buildSummary;
}
export {};
//# sourceMappingURL=qa-gate.d.ts.map