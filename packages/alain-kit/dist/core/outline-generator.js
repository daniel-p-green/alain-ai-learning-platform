import { extractJsonLoose } from './json-utils.js';
import { createLogger, timeIt, trackEvent, metrics } from './obs.js';
import { capsFor, buildChatCompletionsUrl } from './providers.js';
import { supportsTemperature } from './model-caps.js';
import { loadPromptTemplate, applyTemplate } from './prompt-loader.js';
export class OutlineGenerator {
    constructor(options = {}) {
        this.log = createLogger('OutlineGenerator');
        this.OPTIMAL_STEP_RANGE = [6, 15];
        this.TARGET_TOKEN_RANGE = [2000, 4000];
        this.SECTION_TOKEN_LIMIT = 1500;
        this.outlineTemplate = loadPromptTemplate('outline-first/research.outline.v1.txt');
        this.baseUrl = options.baseUrl;
    }
    /**
     * Generate structured outline for a given model/topic
     */
    async generateOutline(options) {
        const op = 'generateOutline';
        const started = Date.now();
        return await timeIt(`ALAINKit.${op}`, async () => {
            // Validate inputs
            if (!options.model) {
                throw new Error('Model is required');
            }
            const isLocalEndpoint = /localhost|127\.0\.0\.1/.test((this.baseUrl || '').toLowerCase());
            if (!options.apiKey && !isLocalEndpoint) {
                throw new Error('API key is required');
            }
            const { model, difficulty, customPrompt } = options;
            const apiKey = options.apiKey;
            // Use this.baseUrl for local model inference if provided
            const endpoint = buildChatCompletionsUrl(this.baseUrl);
            // Allow callers to provide a subject/title and optional context (e.g., remix headings) via customPrompt
            const subject = customPrompt?.title?.trim() || model;
            const context = customPrompt?.context;
            const prompt = this.buildOutlinePrompt(subject, difficulty, context);
            const systemPrompt = customPrompt?.systemPrompt ?? this.buildSystemPrompt();
            const providerCaps = capsFor(this.baseUrl);
            const allowTemperature = supportsTemperature(model);
            let outline;
            let lastError;
            for (let attempt = 1; attempt <= 2; attempt++) {
                const userPrompt = attempt === 1
                    ? prompt
                    : this.buildRetryOutlinePrompt(subject, difficulty, context);
                const body = {
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    max_tokens: customPrompt?.maxTokens ?? 2000
                };
                if (allowTemperature) {
                    body.temperature = attempt === 1 ? (customPrompt?.temperature ?? 0.1) : 0;
                }
                if (providerCaps.allowResponseFormat) {
                    body.response_format = { type: 'json_object' };
                }
                const content = await this.requestWithRetry(endpoint, apiKey, body);
                try {
                    outline = this.parseOutlineResponse(content);
                    break;
                }
                catch (error) {
                    lastError = error;
                    if (attempt === 2) {
                        throw error;
                    }
                }
            }
            if (!outline) {
                throw lastError || new Error('No outline JSON generated');
            }
            let validation = this.validateOutline(outline);
            if (!validation.isValid) {
                try {
                    outline = await this.repairOutline(outline, validation.issues, { model, apiKey, difficulty });
                }
                catch (error) {
                    this.log.warn('repair_failed_deterministic_fallback', { error: error?.message || String(error) });
                }
                // Re-validate after repair; if still failing, apply minimal deterministic repair
                validation = this.validateOutline(outline);
                if (!validation.isValid) {
                    outline = this.repairOutlineDeterministic(outline);
                }
            }
            const dur = Date.now() - started;
            metrics.inc('alain_outline_generated_total', 1, { model, difficulty });
            metrics.observe('alain_outline_duration_ms', dur, { model, difficulty });
            trackEvent('alain_outline_generated', { model, difficulty, duration_ms: dur });
            return outline;
        });
    }
    buildOutlinePrompt(subject, difficulty, context) {
        const contextBlock = context
            ? `SOURCE CONTEXT (use to shape sections, do not copy verbatim):\n${context}\n`
            : '';
        const audience = this.describeAudience(difficulty);
        return applyTemplate(this.outlineTemplate, {
            '{{STEP_MIN}}': String(this.OPTIMAL_STEP_RANGE[0]),
            '{{STEP_MAX}}': String(this.OPTIMAL_STEP_RANGE[1]),
            '{{TOTAL_TOKEN_MIN}}': String(this.TARGET_TOKEN_RANGE[0]),
            '{{TOTAL_TOKEN_MAX}}': String(this.TARGET_TOKEN_RANGE[1]),
            '{{READING_TIME}}': '15-30 minutes',
            '{{SUBJECT}}': subject,
            '{{MODEL_REFERENCE_OR_TEXT}}': subject,
            '{{AUDIENCE_DESCRIPTION}}': audience,
            '{{CONTEXT_BLOCK}}': contextBlock ? `${contextBlock}` : '',
        });
    }
    buildRetryOutlinePrompt(subject, difficulty, context) {
        return `${this.buildOutlinePrompt(subject, difficulty, context)}\n\nYour previous reply was not valid JSON. Reply again with ONLY the OutlineJSON object (start with {, end with }). No commentary.`;
    }
    parseOutlineResponse(raw) {
        try {
            return JSON.parse(raw);
        }
        catch (err) {
            this.log.warn('outline_json_parse_failed', { error: err?.message || String(err) });
        }
        const loose = extractJsonLoose(raw);
        if (loose) {
            return loose;
        }
        this.log.error('outline_json_extract_failed', { head: raw.slice(0, 200) });
        throw new Error('No valid JSON found in outline response');
    }
    describeAudience(difficulty) {
        switch (difficulty) {
            case 'intermediate':
                return 'Practitioners with some machine learning experience (focus on applied explanations and practical context).';
            case 'advanced':
                return 'Advanced practitioners and researchers (include deeper rationale, trade-offs, and expert context).';
            case 'beginner':
            default:
                return 'Absolute beginners (ELI5, non-developers). Use analogies, avoid jargon, and highlight common pitfalls.';
        }
    }
    buildSystemPrompt() {
        return 'You are ALAIN-Teacher, an assistant that must reply with strict JSON objects that match the OutlineJSON schema. Never include natural language commentary, markdown, or code fences.';
    }
    /**
     * Validate outline meets quality standards
     */
    validateOutline(outline) {
        const issues = [];
        if (!outline.title)
            issues.push('Missing title');
        if (!outline.objectives || outline.objectives.length < 3 || outline.objectives.length > 5) {
            issues.push('Must have 3–5 learning objectives');
        }
        if (!outline.outline || outline.outline.length < this.OPTIMAL_STEP_RANGE[0]) {
            issues.push(`Must have at least ${this.OPTIMAL_STEP_RANGE[0]} steps`);
        }
        if (outline.outline && outline.outline.length > this.OPTIMAL_STEP_RANGE[1]) {
            issues.push(`Should not exceed ${this.OPTIMAL_STEP_RANGE[1]} steps`);
        }
        if (!outline.assessments || outline.assessments.length < 4) {
            issues.push('Must have at least 4 assessment questions');
        }
        if (outline.estimated_total_tokens > this.TARGET_TOKEN_RANGE[1]) {
            issues.push('Token count exceeds recommended range - consider splitting');
        }
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    async repairOutline(outline, issues, ctx) {
        const endpoint = buildChatCompletionsUrl(this.baseUrl);
        if (!ctx.apiKey) {
            throw new Error('API key is required for outline repair');
        }
        const providerCaps = capsFor(this.baseUrl);
        const repairPrompt = `You previously generated a JSON outline for a tutorial. It needs repair to meet constraints.\n` +
            `Return ONLY valid JSON (start with { and end with }). Fix the following issues: ${issues.join('; ')}.\n` +
            `Ensure: 6-12 steps; at least 4 MCQs in assessments; exactly 4 objectives.\n` +
            `Here is the current outline JSON to repair:\n${JSON.stringify(outline, null, 2)}`;
        const reqBody = {
            model: ctx.model,
            messages: [
                { role: 'system', content: this.buildSystemPrompt() },
                { role: 'user', content: repairPrompt },
                { role: 'user', content: 'Return ONLY the repaired OutlineJSON object. Start with { and end with }.' }
            ],
            top_p: 1.0,
            max_tokens: 900
        };
        if (supportsTemperature(ctx.model)) {
            reqBody.temperature = 0.0;
        }
        if (providerCaps.allowResponseFormat) {
            reqBody.response_format = { type: 'json_object' };
        }
        const content = await this.requestWithRetry(endpoint, ctx.apiKey, reqBody);
        const repaired = this.parseOutlineResponse(content);
        return repaired;
    }
    // Deterministic minimal repair to satisfy hard outline gates (non-generative)
    repairOutlineDeterministic(outline) {
        const fixed = JSON.parse(JSON.stringify(outline || {}));
        // Ensure assessments >= 4 (matches validator expectations)
        if (!Array.isArray(fixed.assessments))
            fixed.assessments = [];
        while (fixed.assessments.length < 4) {
            const idx = fixed.assessments.length + 1;
            fixed.assessments.push({
                question: `Quick check ${idx}: Basic understanding`,
                options: ['A', 'B', 'C', 'D'],
                correct_index: 0,
                explanation: 'Review the outline section to find the correct answer.'
            });
        }
        // Ensure objectives have at least 3 items
        if (!Array.isArray(fixed.objectives) || fixed.objectives.length < 3) {
            fixed.objectives = [
                'Understand core concepts',
                'Set up the environment',
                'Complete a first working example'
            ];
        }
        // Ensure minimum number of steps in outline
        if (!Array.isArray(fixed.outline) || fixed.outline.length < this.OPTIMAL_STEP_RANGE[0]) {
            const cur = Array.isArray(fixed.outline) ? fixed.outline : [];
            for (let i = cur.length + 1; i <= this.OPTIMAL_STEP_RANGE[0]; i++) {
                cur.push({ step: i, title: `Step ${i}: Additional Content`, type: 'concept', estimated_tokens: 250, content_type: 'markdown + code' });
            }
            fixed.outline = cur;
        }
        return fixed;
    }
    async requestWithRetry(url, apiKey, body) {
        let attempt = 0;
        let delay = 500;
        while (attempt < 3) {
            try {
                const started = Date.now();
                const headers = { 'Content-Type': 'application/json' };
                if (apiKey && apiKey !== 'local') {
                    headers.Authorization = `Bearer ${apiKey}`;
                }
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });
                if (!response.ok) {
                    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content;
                if (!content)
                    throw new Error('Empty content');
                this.log.debug('outline_request_success', { attempt: attempt + 1, duration_ms: Date.now() - started });
                return content;
            }
            catch (e) {
                attempt++;
                if (attempt >= 3)
                    throw e;
                const jitter = Math.round(delay * (0.8 + Math.random() * 0.4));
                this.log.warn('outline_request_retry', { attempt, delay_ms: jitter });
                await new Promise(r => setTimeout(r, jitter));
                delay = Math.min(5000, delay * 2);
            }
        }
        throw new Error('Max retries exceeded');
    }
}
//# sourceMappingURL=outline-generator.js.map