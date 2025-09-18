/**
 * ALAIN-Kit Notebook Builder
 *
 * Assembles final Jupyter notebooks from outline and sections.
 * Ensures proper structure and Colab compatibility.
 */
import { NotebookOutline } from './outline-generator.js';
import { GeneratedSection } from './section-generator.js';
export interface Assessment {
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
}
export interface Setup {
    requirements?: string[];
}
type CellMetadata = Record<string, unknown>;
export interface MarkdownCell {
    cell_type: 'markdown';
    metadata: CellMetadata;
    source: string[];
}
export interface CodeCell {
    cell_type: 'code';
    metadata: CellMetadata;
    source: string[];
    execution_count: number | null;
    outputs: any[];
}
export type NotebookCell = MarkdownCell | CodeCell;
export interface JupyterNotebook {
    cells: NotebookCell[];
    metadata: {
        kernelspec: {
            display_name: string;
            language: string;
            name: string;
        };
        language_info: {
            name: string;
            version: string;
        };
        alain?: {
            schemaVersion: string;
            createdAt: string;
            title?: string;
            builder?: {
                name: string;
                version?: string;
            };
        };
    };
    nbformat: number;
    nbformat_minor: number;
}
export declare class NotebookBuilder {
    private log;
    /**
     * Build complete Jupyter notebook from outline and sections
     */
    buildNotebook(outline: NotebookOutline, sections: GeneratedSection[]): JupyterNotebook;
    private createBrandingCell;
    private createEnvironmentCell;
    private createEnvDocsCell;
    private createDotenvCell;
    private createProviderSetupCell;
    private createProviderSmokeCell;
    /**
     * Adds a light-touch runtime recap so learners see the same checklist that lives in the UI/README.
     */
    private createTransformerRuntimeCell;
    private createTitleCell;
    private createObjectivesCell;
    private createPrerequisitesCell;
    private createSetupCells;
    private createAssessmentIntroCells;
    private createAssessmentSectionHeader;
    private createAssessmentQuestionCell;
    private createTroubleshootingCell;
    private formatCellSource;
}
export {};
//# sourceMappingURL=notebook-builder.d.ts.map