/**
 * ALAIN-Kit Section Generator
 *
 * Generates individual notebook sections with 800-1,500 token limit per section.
 * Ensures beginner-friendly content with executable code and proper structure.
 */
import fs from 'fs';
import path from 'path';
import { extractJsonLoose } from './json-utils.js';
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
    /<<[^>]+>>/,
    /excerpt intentionally truncated/i,
    /code excerpt truncated/i,
    /\.\.\.$/
];
export class SectionGenerator {
    constructor(options = {}) {
        this.log = createLogger('SectionGenerator');
        // Allow larger sections while keeping overall notebook manageable
        this.TOKEN_LIMIT = 2000;
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
            const content = data.choices?.[0]?.message?.content ?? '';
            if (!content.trim()) {
                this.logTrace(sectionNumber, 'empty', content);
                throw new Error('Empty response from API');
            }
            const sanitized = this.sanitizeJsonResponse(content);
            if (!sanitized) {
                this.logTrace(sectionNumber, 'no_json_object', content);
                throw new Error('Section generation returned no JSON object');
            }
            const result = this.parseSectionResponse(sanitized, sectionNumber);
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
            const fallback = this.compileFallbackSection(content, sectionNumber);
            this.logTrace(sectionNumber, 'compiled_fallback', 'Generated fallback after missing JSON');
            this.recordHumanReview(sectionNumber, content, 'compiled_fallback');
            return fallback;
        }
        try {
            const parsed = JSON.parse(extracted);
            const processed = this.postProcessSection(parsed, sectionNumber);
            this.ensureSectionCompleteness(processed, sectionNumber);
            return processed;
        }
        catch (error) {
            this.log.warn('section_json_parse_failed', { section: sectionNumber, head: extracted.slice(0, 120), error: error?.message });
            const loose = extractJsonLoose(extracted);
            if (loose) {
                const processed = this.postProcessSection(loose, sectionNumber);
                this.ensureSectionCompleteness(processed, sectionNumber);
                return processed;
            }
            const fallback = this.compileFallbackSection(content, sectionNumber);
            this.logTrace(sectionNumber, 'compiled_fallback', 'Generated fallback after parse failure');
            this.recordHumanReview(sectionNumber, content, 'compiled_fallback');
            return fallback;
        }
    }
    trimToJson(text) {
        const firstBrace = text.indexOf('{');
        if (firstBrace === -1)
            return '';
        return text.slice(firstBrace);
    }
    sanitizeJsonResponse(text) {
        const trimmed = this.trimToJson(text);
        if (!trimmed)
            return '';
        let depth = 0;
        for (let i = 0; i < trimmed.length; i++) {
            const ch = trimmed[i];
            if (ch === '{')
                depth++;
            if (ch === '}') {
                depth--;
                if (depth === 0) {
                    return trimmed.slice(0, i + 1);
                }
            }
        }
        return '';
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
    recordHumanReview(sectionNumber, payload, reason) {
        const reviewRoot = (process.env.ALAIN_HUMAN_REVIEW_DIR || '').trim();
        if (!reviewRoot)
            return;
        try {
            const scenario = (process.env.ALAIN_SCENARIO_SLUG || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
            const dir = path.resolve(reviewRoot, scenario || 'unknown');
            fs.mkdirSync(dir, { recursive: true });
            const stamp = new Date().toISOString().replace(/[:.]/g, '-');
            const file = path.join(dir, `section-${String(sectionNumber).padStart(2, '0')}-${reason}-${stamp}.txt`);
            const header = `# Human Review Artifact\nScenario: ${scenario}\nSection: ${sectionNumber}\nReason: ${reason}\nTimestamp: ${new Date().toISOString()}\n\n`;
            fs.writeFileSync(file, header + payload, 'utf8');
            this.appendTrace(dir, sectionNumber, reason, payload);
        }
        catch (error) {
            this.log.warn('human_review_write_failed', { error: error?.message || String(error) });
        }
    }
    logTrace(sectionNumber, phase, payload) {
        const reviewRoot = (process.env.ALAIN_HUMAN_REVIEW_DIR || '').trim();
        if (!reviewRoot)
            return;
        try {
            const scenario = (process.env.ALAIN_SCENARIO_SLUG || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '_');
            const dir = path.resolve(reviewRoot, scenario || 'unknown');
            fs.mkdirSync(dir, { recursive: true });
            this.appendTrace(dir, sectionNumber, phase, payload);
        }
        catch (error) {
            this.log.warn('trace_write_failed', { error: error?.message || String(error) });
        }
    }
    appendTrace(dir, sectionNumber, phase, payload) {
        const traceFile = path.join(dir, 'trace.log');
        const line = `${new Date().toISOString()}\tsection=${sectionNumber}\tphase=${phase}\tpreview=${payload.slice(0, 160).replace(/[\r\n]+/g, ' ')}\n`;
        fs.appendFileSync(traceFile, line, 'utf8');
    }
    postProcessSection(section, sectionNumber) {
        if (!section)
            return section;
        if (typeof section.title === 'string') {
            section.title = section.title.replace(/^(Step \d+:) \1/, '$1');
        }
        if (Array.isArray(section.content)) {
            section.content = section.content.map(cell => {
                if (cell?.cell_type === 'markdown' && typeof cell.source === 'string') {
                    cell.source = cell.source.replace(/^(## Step \d+:) \1/, '$1');
                }
                return cell;
            });
        }
        if (typeof section.estimated_tokens === 'number') {
            section.estimated_tokens = Math.min(section.estimated_tokens, this.TOKEN_LIMIT);
        }
        return section;
    }
    ensureSectionCompleteness(section, sectionNumber) {
        const issues = [];
        const markdownCells = section.content.filter(cell => cell?.cell_type === 'markdown');
        const codeCells = section.content.filter(cell => cell?.cell_type === 'code');
        if (markdownCells.length < 1) {
            issues.push('Requires at least one markdown cell with substantive content');
        }
        if (codeCells.length < 1) {
            issues.push('Requires at least one runnable code cell');
        }
        const checkCell = (cell) => {
            const source = Array.isArray(cell?.source) ? cell.source.join('') : String(cell?.source || '');
            for (const pattern of SECTION_PLACEHOLDER_PATTERNS) {
                if (pattern.test(source)) {
                    issues.push(`Placeholder text detected: ${pattern}`);
                    break;
                }
            }
            if (cell?.cell_type === 'markdown' && source.trim().length < 150) {
                issues.push('Markdown content too short (<150 characters)');
            }
            if (cell?.cell_type === 'code') {
                const trimmed = source.trim();
                const lines = trimmed.split(/\r?\n/).filter(Boolean);
                if (lines.length < 3 || lines.every(line => line.trim().startsWith('#'))) {
                    issues.push('Code cell lacks executable content');
                }
            }
        };
        section.content.forEach(checkCell);
        if (!section.callouts || section.callouts.length < 3) {
            issues.push('Missing required callouts (tip, warning, note)');
        }
        if (issues.length) {
            const message = issues.join('; ');
            this.logTrace(sectionNumber, 'incomplete', message);
            this.recordHumanReview(sectionNumber, JSON.stringify(section, null, 2), 'incomplete');
            throw new Error(`Section completeness check failed: ${message}`);
        }
    }
    compileFallbackSection(content, sectionNumber) {
        const sanitized = content.replace(/```/g, '').trim();
        const fallbackMarkdown = sanitized ? sanitized.slice(0, 1800) : 'Content unavailable. Manual authoring required.';
        const fallbackCodeLines = [
            '# Fallback generated after JSON parse failure',
            'import json',
            'payload = {',
            `    "section_number": ${sectionNumber},`,
            '    "status": "manual_review_required"',
            '}',
            'print(json.dumps(payload, indent=2))'
        ];
        return {
            section_number: sectionNumber,
            title: `Section ${sectionNumber}: Manual Review Required`,
            content: [
                { cell_type: 'markdown', source: `## Manual Review Required\n\n${fallbackMarkdown}` },
                { cell_type: 'code', source: fallbackCodeLines.join('\n') }
            ],
            callouts: [
                { type: 'tip', message: '💡 Replace fallback content with finalized instructional material.' },
                { type: 'warning', message: '⚠️ Original provider response could not be parsed. Verify accuracy before publishing.' },
                { type: 'note', message: '📝 Capture the intended learning outcome and include runnable examples.' }
            ],
            estimated_tokens: Math.min(1200, this.TOKEN_LIMIT),
            prerequisites_check: ['Manual author should confirm prerequisites from previous sections.'],
            next_section_hint: 'Continue drafting the next section once this placeholder is replaced.'
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
                if (!content || !String(content).trim())
                    throw new Error('Empty content');
                const sanitized = this.sanitizeJsonResponse(String(content));
                if (!sanitized)
                    throw new Error('No JSON detected');
                this.log.debug('section_request_success', { attempt: attempt + 1, duration_ms: Date.now() - started });
                data.choices[0].message.content = sanitized;
                return data;
            }
            catch (e) {
                attempt++;
                if (attempt > 5)
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