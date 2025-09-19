import { GeneratedSection } from './section-generator.js';
import { NotebookOutline } from './outline-generator.js';
import { NotebookBuilder, JupyterNotebook } from './notebook-builder.js';
import { HarmonyStubRuntime } from './tool-runtime.js';
export declare class NotebookToolController {
    private readonly outline;
    private readonly builder;
    private readonly runtime?;
    private legacySections;
    private toolSections;
    private dependencies;
    private finalizePayload;
    constructor(outline: NotebookOutline, builder: NotebookBuilder, runtime?: HarmonyStubRuntime);
    registerSection(section: GeneratedSection): void;
    hasToolSections(): boolean;
    collectToolSections(): GeneratedSection[];
    handleToolCall(tool: string, rawArgs: unknown): {
        status: 'ok' | 'error';
        message?: string;
    };
    buildNotebook(): JupyterNotebook;
    private collectLegacySections;
    private ensureToolSection;
    private handleAddDependency;
    private handleEmitMarkdownStep;
    private handleEmitCodeCell;
    private handleRecordAssessment;
    private applyFinalizePayload;
}
//# sourceMappingURL=notebook-tool-controller.d.ts.map