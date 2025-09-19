import { SectionGenerator } from './section-generator.js';
import { createLogger } from './obs.js';
const TOOL_INVOCATION = 'notebook.generate_section_tool';
export class ToolCallingOrchestrator {
    constructor(options) {
        this.options = options;
        this.log = createLogger('ToolCallingOrchestrator');
        this.sectionGenerator = new SectionGenerator({ baseUrl: options.baseUrl });
    }
    async generateSections(params) {
        const { outline, modelReference, difficulty, customPrompt, apiKey, maxSections, runtime, notebookController, } = params;
        const totalSections = outline.outline?.length ?? 0;
        const sectionTarget = Math.min(maxSections ?? totalSections, totalSections);
        if (sectionTarget <= 0) {
            throw new Error('Outline contains no sections to generate');
        }
        const resolvedSections = [];
        const durations = [];
        for (let index = 0; index < sectionTarget; index++) {
            const sectionNumber = index + 1;
            const previousSections = resolvedSections.slice();
            runtime?.logInvocation?.(TOOL_INVOCATION, {
                sectionNumber,
                previousCount: previousSections.length,
            });
            const started = Date.now();
            try {
                const section = await this.sectionGenerator.generateSection({
                    outline,
                    sectionNumber,
                    previousSections,
                    modelReference,
                    apiKey: apiKey ?? this.options.apiKey,
                    customPrompt,
                    difficulty,
                });
                const duration = Date.now() - started;
                durations.push(duration);
                runtime?.completeInvocation?.(TOOL_INVOCATION, 'ok', {
                    sectionNumber,
                    markdownCells: section.content.filter((cell) => cell.cell_type === 'markdown').length,
                    codeCells: section.content.filter((cell) => cell.cell_type === 'code').length,
                });
                runtime?.logInvocation?.('notebook.section_validation', { sectionNumber });
                const validation = this.sectionGenerator.validateSection(section);
                if (!validation.isValid) {
                    runtime?.completeInvocation?.('notebook.section_validation', 'error', {
                        sectionNumber,
                        issues: validation.issues,
                    });
                    this.log.error('tool_section_validation_failed', {
                        sectionNumber,
                        issues: validation.issues,
                    });
                    throw new Error(`Section ${sectionNumber} failed validation: ${validation.issues.join(', ')}`);
                }
                runtime?.completeInvocation?.('notebook.section_validation', 'ok', {
                    sectionNumber,
                    estimatedTokens: section.estimated_tokens,
                    callouts: section.callouts.length,
                });
                resolvedSections.push(section);
                notebookController.registerSection(section);
            }
            catch (error) {
                runtime?.completeInvocation?.(TOOL_INVOCATION, 'error', {
                    sectionNumber,
                    message: error instanceof Error ? error.message : String(error),
                });
                this.log.error('tool_section_failed', {
                    sectionNumber,
                    error: error instanceof Error ? error.message : String(error),
                });
                throw error;
            }
        }
        const totalDuration = durations.reduce((acc, value) => acc + value, 0);
        return {
            sections: resolvedSections,
            durations,
            totalDuration,
        };
    }
}
//# sourceMappingURL=tool-orchestrator.js.map