/**
 * ALAIN-Kit Integration
 *
 * Main entry point that orchestrates outline generation, section filling,
 * notebook building, and validation in a single pipeline.
 */
import { mkdirSync, writeFileSync } from 'fs';
import { OutlineGenerator } from '../core/outline-generator.js';
import { SectionGenerator } from '../core/section-generator.js';
import { NotebookBuilder } from '../core/notebook-builder.js';
import { QualityValidator } from './quality-validator.js';
import { ColabValidator } from './colab-validator.js';
import { QaGate } from './qa-gate.js';
import { SemanticValidator } from './semantic-validator.js';
import { metrics, trackEvent, createLogger } from '../core/obs.js';
import { HarmonyStubRuntime } from '../core/tool-runtime.js';
import { NotebookToolController } from '../core/notebook-tool-controller.js';
import { ValidatorToolController } from '../core/validator-tool-controller.js';
import { LegacyNotebookOrchestrator } from '../core/orchestrator.js';
import { ToolCallingOrchestrator } from '../core/tool-orchestrator.js';
export class ALAINKit {
    constructor(options = {}) {
        this.log = createLogger('ALAINKit');
        this.baseUrl = options.baseUrl;
        this.outlineGenerator = new OutlineGenerator({ baseUrl: options.baseUrl });
        this.sectionGenerator = new SectionGenerator({ baseUrl: options.baseUrl });
        this.notebookBuilder = new NotebookBuilder();
        this.qualityValidator = new QualityValidator();
        this.colabValidator = new ColabValidator();
        this.qaGate = new QaGate();
        this.semanticValidator = new SemanticValidator();
        // Checkpoint directory: allow resume across runs when ALAIN_CHECKPOINT_DIR is set
        const stamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.checkpointsDir = process.env.ALAIN_CHECKPOINT_DIR || `/tmp/alain-kit-${stamp}`;
        try {
            mkdirSync(this.checkpointsDir, { recursive: true });
        }
        catch { }
        this.orchestrator = new LegacyNotebookOrchestrator(this.sectionGenerator, this.checkpointsDir, this.baseUrl);
        if (process.env.ALAIN_TOOL_RUNTIME === 'stub') {
            this.toolRuntime = new HarmonyStubRuntime();
            const tools = [
                { namespace: 'notebook', name: 'add_dependency', description: 'Register a dependency for the runtime environment.' },
                { namespace: 'notebook', name: 'emit_markdown_step', description: 'Append markdown instruction content for a section.' },
                { namespace: 'notebook', name: 'emit_code_cell', description: 'Append a runnable code cell aligned with the current section.' },
                { namespace: 'notebook', name: 'record_assessment', description: 'Create assessment items (MCQs, exercises) for the lesson.' },
                { namespace: 'notebook', name: 'finalize', description: 'Finalize notebook metadata, summary, and export artifacts.' },
                { namespace: 'notebook', name: 'generate_section_legacy', description: 'Legacy section generator placeholder until full tool calling is enabled.' },
                { namespace: 'notebook', name: 'section_validation', description: 'Validate generated section content against structural checks.' },
                { namespace: 'notebook', name: 'record_prerequisites', description: 'Track prerequisite callouts emitted by sections.' },
                { namespace: 'validator', name: 'run_quality', description: 'Execute notebook quality validation and return metrics.' },
                { namespace: 'validator', name: 'run_colab', description: 'Execute Colab compatibility checks and return issues/fixes.' },
                { namespace: 'validator', name: 'run_qa_gate', description: 'Run the lightweight QA gate before downstream validators.' },
                { namespace: 'validator', name: 'run_semantic', description: 'Run semantic validation against policy/completeness heuristics.' },
                { namespace: 'pipeline', name: 'error', description: 'Represents terminal pipeline errors before teardown.' }
            ];
            tools.forEach(descriptor => this.toolRuntime?.registerTool(descriptor));
        }
    }
    /**
     * Generate complete notebook with validation
     */
    async generateNotebook(config) {
        const pipelineStart = Date.now();
        const toolRuntime = this.toolRuntime;
        toolRuntime?.startSession({
            modelReference: config.modelReference,
            difficulty: config.difficulty || 'beginner'
        });
        try {
            const apiKeyForRequests = config.apiKey;
            // Step 1: Generate outline
            const tOutlineStart = Date.now();
            toolRuntime?.logInvocation('notebook.generate_outline', {
                modelReference: config.modelReference,
                difficulty: config.difficulty || 'beginner'
            });
            let outline;
            try {
                outline = await this.outlineGenerator.generateOutline({
                    model: config.modelReference,
                    apiKey: apiKeyForRequests,
                    difficulty: config.difficulty || 'beginner',
                    customPrompt: config.customPrompt
                });
                toolRuntime?.completeInvocation('notebook.generate_outline', 'ok', {
                    stepCount: outline.outline.length,
                    objectives: outline.objectives.length
                });
            }
            catch (outlineError) {
                toolRuntime?.completeInvocation('notebook.generate_outline', 'error', {
                    message: outlineError instanceof Error ? outlineError.message : String(outlineError)
                });
                throw outlineError;
            }
            const tOutline = Date.now() - tOutlineStart;
            // Validate outline
            const outlineValidation = this.outlineGenerator.validateOutline(outline);
            if (!outlineValidation.isValid) {
                throw new Error(`Outline validation failed: ${outlineValidation.issues.join(', ')}`);
            }
            const notebookController = new NotebookToolController(outline, this.notebookBuilder, toolRuntime);
            const validatorController = new ValidatorToolController({
                qaGate: this.qaGate,
                semanticValidator: this.semanticValidator,
                qualityValidator: this.qualityValidator,
                colabValidator: this.colabValidator,
                runtime: toolRuntime
            });
            let sectionsResult;
            const resolvedSections = [];
            const useToolOrchestrator = process.env.ALAIN_TOOL_ORCHESTRATOR === '1';
            if (useToolOrchestrator) {
                const toolModel = process.env.ALAIN_TOOL_MODEL || 'gpt-4o-mini';
                const toolApiKey = config.apiKey ||
                    process.env.ALAIN_TOOL_API_KEY ||
                    process.env.OPENAI_API_KEY ||
                    process.env.POE_API_KEY;
                if (!toolApiKey) {
                    this.log.warn('Tool orchestrator enabled but no API key provided. Falling back to legacy generator.');
                }
                else {
                    try {
                        const toolOrchestrator = new ToolCallingOrchestrator({
                            model: toolModel,
                            apiKey: toolApiKey,
                            baseUrl: this.baseUrl
                        });
                        sectionsResult = await toolOrchestrator.generateSections({
                            outline,
                            modelReference: config.modelReference,
                            difficulty: config.difficulty || 'beginner',
                            runtime: toolRuntime,
                            notebookController
                        });
                        sectionsResult.sections.forEach(section => resolvedSections.push(section));
                    }
                    catch (error) {
                        this.log.warn('Tool orchestrator failed, reverting to legacy sections.', {
                            error: error instanceof Error ? error.message : String(error)
                        });
                    }
                }
            }
            if (!sectionsResult) {
                sectionsResult = await this.orchestrator.generateSections({
                    outline,
                    modelReference: config.modelReference,
                    apiKey: apiKeyForRequests,
                    difficulty: config.difficulty || 'beginner',
                    customPrompt: config.customPrompt,
                    maxSections: config.maxSections,
                    runtime: toolRuntime
                });
                sectionsResult.sections.forEach(section => {
                    resolvedSections.push(section);
                    notebookController.registerSection(section);
                });
            }
            else if (!notebookController.hasToolSections()) {
                sectionsResult.sections.forEach(section => notebookController.registerSection(section));
            }
            const sectionDurations = sectionsResult.durations;
            const tSectionsTotal = sectionsResult.totalDuration;
            // Step 3: Build notebook
            const tBuildStart = Date.now();
            let notebook = notebookController.buildNotebook();
            const tBuild = Date.now() - tBuildStart;
            // Step 3.5: Run lightweight QA gate before expensive validators
            const qaReport = await validatorController.runQaGate({
                outline,
                sections: resolvedSections,
                notebook
            });
            trackEvent('alain_qa_gate_result', {
                status: qaReport.overall_status,
                warnings: qaReport.warning_issues.length,
                blocking: qaReport.blocking_issues.length
            });
            if (qaReport.overall_status === 'fail') {
                throw new Error(`QA gate failed: ${qaReport.blocking_issues.join('; ') || qaReport.summary}`);
            }
            const semanticReport = await validatorController.runSemantic({
                outline,
                sections: resolvedSections,
                notebook,
                apiKey: config.apiKey || process.env.POE_API_KEY || process.env.OPENAI_API_KEY,
                baseUrl: this.baseUrl,
                model: process.env.ALAIN_QA_MODEL
            });
            if (semanticReport.status === 'fail') {
                throw new Error(`Semantic QA failed: ${semanticReport.issues.join('; ') || 'Review required'}`);
            }
            // Step 4: Quality validation
            const tempPath = `/tmp/alain-notebook-${Date.now()}.ipynb`;
            writeFileSync(tempPath, JSON.stringify(notebook, null, 2));
            const tQualityStart = Date.now();
            const qualityMetrics = validatorController.runQuality(tempPath);
            const tQuality = Date.now() - tQualityStart;
            // Step 5: Colab validation and fixes
            const tColabStart = Date.now();
            const colabValidation = await validatorController.runColab(tempPath);
            const tColab = Date.now() - tColabStart;
            if (!colabValidation.isCompatible && colabValidation.fixedNotebook) {
                notebook = colabValidation.fixedNotebook;
            }
            // Step 6: Generate validation report
            const validationReport = this.generateValidationReport(qualityMetrics, colabValidation);
            const duration = Date.now() - pipelineStart;
            metrics.inc('alain_pipeline_success_total', 1, { model: config.modelReference, difficulty: config.difficulty || 'beginner' });
            metrics.observe('alain_pipeline_duration_ms', duration, { model: config.modelReference, difficulty: config.difficulty || 'beginner' });
            trackEvent('alain_pipeline_success', { model: config.modelReference, difficulty: config.difficulty || 'beginner', duration_ms: duration, sections: resolvedSections.length, qualityScore: qualityMetrics.qualityScore });
            return {
                success: true,
                qualityScore: qualityMetrics.qualityScore,
                colabCompatible: colabValidation.isCompatible,
                notebook,
                outline,
                sections: resolvedSections,
                qaReport,
                semanticReport,
                qualityMetrics,
                colabValidation,
                validationReport,
                phaseTimings: {
                    outline_ms: tOutline,
                    sections_ms_total: tSectionsTotal,
                    section_ms: sectionDurations,
                    build_ms: tBuild,
                    quality_ms: tQuality,
                    colab_ms: tColab,
                    total_ms: duration
                }
            };
        }
        catch (error) {
            const duration = Date.now() - pipelineStart;
            const errMessage = error instanceof Error ? error.message : String(error);
            this.toolRuntime?.logInvocation('pipeline.error', { message: errMessage });
            this.toolRuntime?.completeInvocation('pipeline.error', 'error', { message: errMessage });
            metrics.inc('alain_pipeline_failures_total', 1, { model: config.modelReference, difficulty: config.difficulty || 'beginner' });
            trackEvent('alain_pipeline_failure', { model: config.modelReference, difficulty: config.difficulty || 'beginner', duration_ms: duration, error: errMessage });
            return {
                success: false,
                qualityScore: 0,
                colabCompatible: false,
                notebook: null,
                outline: {},
                sections: [],
                qaReport: {
                    notebook_title: config.customPrompt?.title || 'Unknown Notebook',
                    qa_timestamp: new Date().toISOString(),
                    overall_status: 'fail',
                    summary: errMessage || 'QA gate unavailable',
                    metrics: {
                        outline_steps: 0,
                        sections_expected: 0,
                        sections_received: 0,
                        objectives_in_outline: 0,
                        exercises_count: 0,
                        assessments_count: 0,
                        avg_section_length_chars: 0,
                        markdown_ratio_estimate: 0
                    },
                    quality_gates: {
                        outline_completeness: { status: 'fail', notes: ['Pipeline aborted before QA gate'] },
                        section_alignment: { status: 'fail', notes: [] },
                        placeholder_scan: { status: 'fail', notes: [] }
                    },
                    blocking_issues: [errMessage || 'Pipeline failed before QA.'],
                    warning_issues: [],
                    recommended_actions: {
                        must_fix: [errMessage || 'Investigate failure'],
                        should_fix: []
                    },
                    automation_hooks: {
                        regex_checks: []
                    },
                    source_trace: {
                        outline_reference: 'qa.unavailable',
                        section_ids: []
                    }
                },
                semanticReport: {
                    status: 'fail',
                    issues: [errMessage || 'Pipeline aborted before semantic QA.'],
                    fillerSections: [],
                    recommendations: [],
                    rawResponse: ''
                },
                qualityMetrics: {},
                colabValidation: {},
                validationReport: `Generation failed: ${errMessage}`
            };
        }
        finally {
            toolRuntime?.endSession();
        }
    }
    generateValidationReport(quality, colab) {
        return `# ALAIN-Kit Validation Report

## Quality Assessment
- **Score:** ${quality.qualityScore}/100
- **Standards:** ${quality.meetsStandards ? '✅ Met' : '❌ Not met'}
- **Steps:** ${quality.stepCount}
- **Reading Time:** ${quality.estimatedReadingTime} minutes

## Colab Compatibility
- **Status:** ${colab.isCompatible ? '✅ Compatible' : '❌ Issues fixed'}
- **Issues:** ${colab.issues.length}

## Summary
${quality.meetsStandards && colab.isCompatible ?
            '🎉 Ready for production deployment!' :
            '⚠️ Improvements applied - ready for testing'}`;
    }
}
/**
 * Simple usage example
 */
export async function generateNotebook(options) {
    const alainKit = new ALAINKit({ baseUrl: options.baseUrl });
    return await alainKit.generateNotebook({
        modelReference: options.modelReference,
        apiKey: options.apiKey,
        difficulty: options.difficulty || 'beginner',
        maxSections: options.maxSections || 5,
        customPrompt: options.customPrompt
    });
}
//# sourceMappingURL=integration.js.map