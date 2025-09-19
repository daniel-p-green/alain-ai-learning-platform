export class NotebookToolController {
    constructor(outline, builder, runtime) {
        this.outline = outline;
        this.builder = builder;
        this.runtime = runtime;
        this.legacySections = [];
        this.toolSections = new Map();
        this.dependencies = [];
    }
    registerSection(section) {
        const index = section.section_number - 1;
        if (index < 0) {
            throw new Error(`Invalid section number ${section.section_number}`);
        }
        this.legacySections[index] = section;
    }
    hasToolSections() {
        return this.toolSections.size > 0;
    }
    collectToolSections() {
        return Array.from(this.toolSections.values()).sort((a, b) => a.section_number - b.section_number);
    }
    handleToolCall(tool, rawArgs) {
        try {
            switch (tool) {
                case 'notebook.add_dependency':
                    this.handleAddDependency(rawArgs);
                    break;
                case 'notebook.emit_markdown_step':
                    this.handleEmitMarkdownStep(rawArgs);
                    break;
                case 'notebook.emit_code_cell':
                    this.handleEmitCodeCell(rawArgs);
                    break;
                case 'notebook.record_assessment':
                    this.handleRecordAssessment(rawArgs);
                    break;
                case 'notebook.finalize':
                    this.finalizePayload = rawArgs;
                    break;
                default:
                    return { status: 'error', message: `Unknown notebook tool: ${tool}` };
            }
            return { status: 'ok' };
        }
        catch (error) {
            return {
                status: 'error',
                message: error instanceof Error ? error.message : String(error)
            };
        }
    }
    buildNotebook() {
        const sections = this.hasToolSections() ? this.collectToolSections() : this.collectLegacySections();
        if (!sections.length) {
            throw new Error('No notebook sections were generated.');
        }
        if (this.hasToolSections()) {
            this.applyFinalizePayload();
        }
        return this.builder.buildNotebook(this.outline, sections);
    }
    collectLegacySections() {
        return this.legacySections.map((section, idx) => {
            if (!section) {
                throw new Error(`Section ${idx + 1} missing before finalize`);
            }
            return section;
        });
    }
    ensureToolSection(sectionNumber) {
        if (sectionNumber < 1) {
            throw new Error(`Invalid section number ${sectionNumber}`);
        }
        const existing = this.toolSections.get(sectionNumber);
        if (existing)
            return existing;
        const blank = {
            section_number: sectionNumber,
            title: `Section ${sectionNumber}`,
            content: [],
            callouts: [],
            estimated_tokens: 0,
            prerequisites_check: [],
            next_section_hint: ''
        };
        this.toolSections.set(sectionNumber, blank);
        return blank;
    }
    handleAddDependency(payload) {
        if (!payload?.package) {
            throw new Error('add_dependency requires a package name');
        }
        this.dependencies.push(payload);
        this.runtime?.logInvocation('notebook.add_dependency', payload);
        this.runtime?.completeInvocation('notebook.add_dependency', 'ok', payload);
    }
    handleEmitMarkdownStep(payload) {
        const { section_number: sectionNumber, title, body, callouts, prerequisites_check, next_section_hint, estimated_tokens } = payload ?? {};
        if (!sectionNumber || !body) {
            throw new Error('emit_markdown_step requires section_number and body');
        }
        const section = this.ensureToolSection(Number(sectionNumber));
        if (typeof title === 'string' && title.trim()) {
            section.title = title.trim();
        }
        if (Array.isArray(callouts)) {
            section.callouts = callouts;
        }
        section.prerequisites_check = Array.isArray(prerequisites_check) ? prerequisites_check : [];
        section.next_section_hint = typeof next_section_hint === 'string' ? next_section_hint : section.next_section_hint || '';
        section.estimated_tokens = typeof estimated_tokens === 'number' ? estimated_tokens : section.estimated_tokens || 0;
        const markdownCell = {
            cell_type: 'markdown',
            source: String(body)
        };
        section.content.push(markdownCell);
    }
    handleEmitCodeCell(payload) {
        const { section_number: sectionNumber, code, language } = payload ?? {};
        if (!sectionNumber || typeof code !== 'string') {
            throw new Error('emit_code_cell requires section_number and code');
        }
        if (language && language !== 'python') {
            throw new Error('Only python code cells are supported currently');
        }
        const section = this.ensureToolSection(Number(sectionNumber));
        const codeCell = {
            cell_type: 'code',
            source: String(code)
        };
        section.content.push(codeCell);
    }
    handleRecordAssessment(payload) {
        if (!payload || !Array.isArray(payload.questions)) {
            throw new Error('record_assessment requires a questions array');
        }
        this.outline.assessments = this.outline.assessments || [];
        payload.questions.forEach((question) => {
            if (!question || typeof question.prompt !== 'string')
                return;
            this.outline.assessments.push({
                question: question.prompt,
                options: Array.isArray(question.options) ? question.options : [],
                correct_index: Number(question.correct_index ?? 0),
                explanation: question.explanation || ''
            });
        });
    }
    applyFinalizePayload() {
        if (!this.finalizePayload)
            return;
        const { outline_summary, next_steps, references, reading_time_minutes } = this.finalizePayload;
        if (outline_summary) {
            this.outline.summary = outline_summary;
        }
        if (Array.isArray(next_steps)) {
            this.outline.next_steps = next_steps.join('\n');
        }
        if (Array.isArray(references)) {
            this.outline.references = references;
        }
        if (typeof reading_time_minutes === 'number') {
            this.outline.target_reading_time = `${Math.round(reading_time_minutes)} minutes`;
        }
        if (this.dependencies.length) {
            const setup = this.outline.setup || { requirements: [], environment: [], commands: [] };
            setup.commands = setup.commands || [];
            const installCommands = this.dependencies.map(dep => {
                if (dep.manager === 'pip') {
                    return `pip install ${dep.package}${dep.version ? `==${dep.version}` : ''}`;
                }
                if (dep.manager === 'conda') {
                    return `conda install ${dep.package}${dep.version ? `=${dep.version}` : ''}`;
                }
                return `apt-get install ${dep.package}`;
            });
            setup.commands = [...setup.commands, ...installCommands];
            this.outline.setup = setup;
        }
    }
}
//# sourceMappingURL=notebook-tool-controller.js.map