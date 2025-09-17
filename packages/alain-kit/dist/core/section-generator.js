/**
 * ALAIN-Kit Section Generator
 *
 * Generates individual notebook sections with 800-1,500 token limit per section.
 * Ensures beginner-friendly content with executable code and proper structure.
 */
import { createLogger, timeIt, trackEvent, metrics } from './obs.js';
import { capsFor, buildChatCompletionsUrl } from './providers.js';
import { supportsTemperature } from './model-caps.js';
import { loadPromptTemplate, applyTemplate } from './prompt-loader.js';
const SECTION_SYSTEM_PROMPT = [
    'You are ALAIN-Teacher generating polished notebook sections for production notebooks.',
    'Reply with a single valid JSON object that matches the required schema.',
    'Do not output planning text, "Thinking...", code fences, or narration outside the JSON.',
    'Replace every field with fully developed instructional content and runnable code; never leave template phrases, placeholders, or ellipses.'
].join('\n');
const SECTION_PLACEHOLDER_PATTERNS = [
    /Explanation with analogies/i,
    /Clear, commented code/i,
    /Helpful guidance/i,
    /Minimal runnable example to satisfy validation/i,
    /We need to produce JSON/i,
    /Thinking\.{3}/i,
    /Replace the placeholder/i,
    /<<[^>]+>>/
];
export class SectionGenerator {
    constructor(options = {}) {
        this.log = createLogger('SectionGenerator');
        // Tighten per-section token limit to help keep total under ~6000 for 6 sections
        this.TOKEN_LIMIT = 1000;
        this.MIN_TOKENS = 800;
        this.sectionTemplate = loadPromptTemplate('section-fill/research.section.v1.txt');
        this.baseUrl = options.baseUrl;
    }
    /**
     * Generate content for a specific section
     */
    async generateSection(options) {
        const op = 'generateSection';
        const started = Date.now();
        return await timeIt(`ALAINKit.${op}`, async () => {
            // Validate inputs
            if (!options.modelReference) {
                throw new Error('Model reference is required');
            }
            const isLocalEndpoint = /localhost|127\.0\.0\.1/.test((this.baseUrl || '').toLowerCase());
            if (!options.apiKey && !isLocalEndpoint) {
                throw new Error('API key is required');
            }
            if (typeof options.sectionNumber !== 'number' || options.sectionNumber < 1) {
                throw new Error('Valid section number is required');
            }
            const { outline, sectionNumber, previousSections, modelReference, apiKey, customPrompt } = options;
            const prompt = this.buildSectionPrompt(outline, sectionNumber, previousSections, modelReference);
            const endpoint = buildChatCompletionsUrl(this.baseUrl);
            const providerCaps = capsFor(this.baseUrl);
            let data;
            try {
                const messages = [
                    { role: 'system', content: SECTION_SYSTEM_PROMPT },
                    { role: 'user', content: prompt }
                ];
                const body = {
                    model: modelReference,
                    messages,
                    max_tokens: customPrompt?.maxTokens || this.TOKEN_LIMIT,
                };
                if (supportsTemperature(modelReference)) {
                    body.temperature = customPrompt?.temperature ?? 0.2;
                }
                if (providerCaps.allowResponseFormat)
                    body.response_format = { type: 'json_object' };
                data = await this.requestWithRetry(endpoint, apiKey, body);
            }
            catch (error) {
                this.log.error('section_api_failed', { error: error?.message || String(error) });
                throw new Error(`Failed to generate section: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            const content = data.choices?.[0]?.message?.content || '';
            if (!content) {
                throw new Error('Empty response from API');
            }
            const result = this.parseSectionResponse(content, sectionNumber);
            const dur = Date.now() - started;
            const difficulty = options.difficulty || 'unknown';
            metrics.inc('alain_section_generated_total', 1, { model: modelReference, difficulty });
            metrics.observe('alain_section_duration_ms', dur, { model: modelReference, difficulty, section: sectionNumber });
            trackEvent('alain_section_generated', { section: sectionNumber, modelReference, difficulty, duration_ms: dur });
            return result;
        });
    }
    buildSectionPrompt(outline, // TODO: Replace with proper NotebookOutline type
    sectionNumber, previousSections, modelReference) {
        const currentStep = outline.outline?.[sectionNumber - 1] || {};
        const title = currentStep?.title || `Section ${sectionNumber}`;
        const outlineJson = JSON.stringify(outline ?? {}, null, 2);
        const previousJson = JSON.stringify(previousSections ?? [], null, 2);
        return applyTemplate(this.sectionTemplate, {
            '{{MIN_TOKENS}}': String(this.MIN_TOKENS),
            '{{MAX_TOKENS}}': String(this.TOKEN_LIMIT),
            '{{SECTION_NUMBER}}': String(sectionNumber),
            '{{SECTION_TITLE}}': title,
            '{{DEFAULT_TOKENS}}': String(Math.min(Math.max(this.MIN_TOKENS + 200, 1200), this.TOKEN_LIMIT)),
            '{{OUTLINE_JSON}}': outlineJson,
            '{{PREVIOUS_SECTIONS}}': previousJson,
            '{{MODEL_REFERENCE}}': modelReference,
            '{{MODEL_REFERENCE_OR_TEXT}}': modelReference,
        });
    }
    parseSectionResponse(content, sectionNumber) {
        const extracted = this.extractFirstJsonObject(content);
        if (!extracted) {
            this.log.warn('section_json_missing', { section: sectionNumber, head: content.slice(0, 120) });
            throw new Error('Section generation returned no JSON object');
        }
        try {
            return JSON.parse(extracted);
        }
        catch (error) {
            this.log.warn('section_json_parse_failed', { section: sectionNumber, head: extracted.slice(0, 120), error: error?.message });
            throw new Error(`Invalid JSON returned for section ${sectionNumber}`);
        }
    }
    extractFirstJsonObject(text) {
        const s = String(text || '');
        let start = -1;
        let depth = 0;
        for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === '{') {
                if (start === -1)
                    start = i;
                depth++;
            }
            else if (ch === '}') {
                if (depth > 0)
                    depth--;
                if (depth === 0 && start !== -1) {
                    return s.slice(start, i + 1);
                }
            }
        }
        return null;
    }
    createFallbackSection(sectionNumber, content) {
        // Legacy fallback retained for backwards compatibility but no longer used.
        return {
            section_number: sectionNumber,
            title: `Section ${sectionNumber}`,
            content: [
                {
                    cell_type: 'markdown',
                    source: `## Section ${sectionNumber}\n\n${content.substring(0, 500)}...`
                },
                {
                    cell_type: 'code',
                    source: [
                        '# Minimal runnable example to satisfy validation',
                        "def greet(name='ALAIN'):",
                        "    return f'Hello, {name}!'",
                        '',
                        "print(greet())"
                    ].join('\n')
                }
            ],
            callouts: [],
            estimated_tokens: 900,
            prerequisites_check: [],
            next_section_hint: 'Continue to next section'
        };
    }
    async requestWithRetry(url, apiKey, body) {
        let attempt = 0;
        let delay = 500;
        while (true) {
            try {
                const started = Date.now();
                const headers = { 'Content-Type': 'application/json' };
                if (apiKey && apiKey !== 'local')
                    headers.Authorization = `Bearer ${apiKey}`;
                const resp = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body)
                });
                if (!resp.ok)
                    throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                const content = data.choices?.[0]?.message?.content;
                if (!content)
                    throw new Error('Empty content');
                this.log.debug('section_request_success', { attempt: attempt + 1, duration_ms: Date.now() - started });
                return data;
            }
            catch (e) {
                attempt++;
                if (attempt > 3)
                    throw e;
                const jitter = Math.round(delay * (0.8 + Math.random() * 0.4));
                this.log.warn('section_request_retry', { attempt, delay_ms: jitter });
                await new Promise(r => setTimeout(r, jitter));
                delay = Math.min(5000, delay * 2);
            }
        }
    }
    /**
     * Validate section meets quality standards
     */
    validateSection(section) {
        const issues = [];
        if (!section?.content || !Array.isArray(section.content) || section.content.length === 0) {
            issues.push('Section has no content');
            return { isValid: false, issues };
        }
        const approxTokens = this.estimateSectionTokens(section);
        const tolerance = Math.max(Math.round(this.MIN_TOKENS * 0.5), 200);
        if (typeof section.estimated_tokens !== 'number') {
            this.log.warn('section_missing_estimate', { section: section.section_number ?? 'unknown', approxTokens });
        }
        else {
            const estimate = section.estimated_tokens;
            const delta = Math.abs(estimate - approxTokens);
            if (delta > tolerance) {
                this.log.warn('section_estimate_mismatch', {
                    section: section.section_number ?? 'unknown',
                    estimate,
                    approxTokens,
                    tolerance
                });
            }
        }
        const upperBound = Math.round(this.TOKEN_LIMIT * 1.1);
        const lowerBound = Math.round(this.MIN_TOKENS * 0.85);
        if (approxTokens > upperBound) {
            issues.push(`Section exceeds token limit (~${approxTokens} > ${this.TOKEN_LIMIT})`);
        }
        if (approxTokens < lowerBound) {
            issues.push(`Section below minimum tokens (~${approxTokens} < ${this.MIN_TOKENS})`);
        }
        const hasMarkdown = section.content.some(cell => cell?.cell_type === 'markdown');
        const hasCode = section.content.some(cell => cell?.cell_type === 'code');
        if (!hasMarkdown)
            issues.push('Section missing explanatory content');
        if (!hasCode)
            issues.push('Section missing code examples');
        let containsPlaceholder = false;
        section.content.forEach(cell => {
            const source = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source ?? '');
            if (!containsPlaceholder) {
                for (const pattern of SECTION_PLACEHOLDER_PATTERNS) {
                    if (pattern.test(source)) {
                        containsPlaceholder = true;
                        issues.push('Section contains placeholder or meta-instruction text');
                        break;
                    }
                }
            }
        });
        return {
            isValid: issues.length === 0,
            issues
        };
    }
    estimateSectionTokens(section) {
        const text = (section.content || [])
            .map(cell => Array.isArray(cell.source) ? cell.source.join('') : String(cell.source ?? ''))
            .join('\n');
        if (!text) {
            return 0;
        }
        return Math.max(0, Math.round(text.length / 4));
    }
}
//# sourceMappingURL=section-generator.js.map