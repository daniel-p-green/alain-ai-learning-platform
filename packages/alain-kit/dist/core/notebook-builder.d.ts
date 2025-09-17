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
export interface JupyterNotebook {
    cells: Array<{
        cell_type: 'markdown' | 'code';
        metadata: {};
        source: string[];
    }>;
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
//# sourceMappingURL=notebook-builder.d.ts.map