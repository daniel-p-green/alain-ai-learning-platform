import { NotebookOutline } from '../core/outline-generator';
import { GeneratedSection } from '../core/section-generator';
import { createLogger } from '../core/obs';
import { extractJsonLoose } from '../core/json-utils';
import { capsFor } from '../core/providers';
import { supportsTemperature } from '../core/model-caps';

export type SemanticStatus = 'pass' | 'warn' | 'fail';

export interface SemanticReport {
  status: SemanticStatus;
  issues: string[];
  fillerSections: string[];
  recommendations: string[];
  rawResponse: string;
}

interface EvaluateParams {
  outline: NotebookOutline;
  sections: GeneratedSection[];
  notebook: any;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

const DEFAULT_MODEL = process.env.ALAIN_QA_MODEL || 'gpt-oss-20b';
const DEFAULT_BASE = process.env.ALAIN_QA_BASE || 'https://api.poe.com';

export class SemanticValidator {
  private readonly log = createLogger('SemanticValidator');

  async evaluate(params: EvaluateParams): Promise<SemanticReport> {
    const apiKey = params.apiKey || process.env.POE_API_KEY || process.env.OPENAI_API_KEY;
    const baseUrl = (params.baseUrl || DEFAULT_BASE).replace(/\/$/, '');
    const providerCaps = capsFor(baseUrl);
    const model = params.model || DEFAULT_MODEL;

    if (!apiKey) {
      this.log.warn('semantic_qc_skipped', { reason: 'missing_api_key' });
      return {
        status: 'warn',
        issues: ['Semantic QA skipped: missing API key.'],
        fillerSections: [],
        recommendations: ['Provide POE_API_KEY or OPENAI_API_KEY to enable semantic QA.'],
        rawResponse: ''
      };
    }

    // If running against a local endpoint we skip the remote semantic check
    if (/localhost|127\.0\.0\.1/i.test(baseUrl)) {
      this.log.info('semantic_qc_skipped_local_base', { baseUrl });
      return {
        status: 'warn',
        issues: ['Semantic QA skipped for local base URL.'],
        fillerSections: [],
        recommendations: ['Run semantic QA in an environment that can call the Poe API.'],
        rawResponse: ''
      };
    }

    const prompt = this.buildPrompt(params.outline, params.sections, params.notebook);

    const body: any = {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a rigorous notebook quality reviewer. Respond ONLY with JSON matching the response schema.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: supportsTemperature(model) ? 0 : undefined
    };
    if (providerCaps.allowResponseFormat) {
      body.response_format = { type: 'json_object' } as const;
    }

    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Semantic QA call failed: ${res.status} ${res.statusText} - ${errBody}`);
      }
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content || '';
      const parsed = this.parseResponse(raw);
      return { ...parsed, rawResponse: raw };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.log.error('semantic_qc_error', { error: errMsg });
      return {
        status: 'warn',
        issues: [`Semantic QA request failed: ${errMsg}`],
        fillerSections: [],
        recommendations: ['Retry semantic QA once network/service is available.'],
        rawResponse: ''
      };
    }
  }

  private buildPrompt(outline: NotebookOutline, sections: GeneratedSection[], notebook: any): string {
    const objectives = Array.isArray(outline.objectives) ? outline.objectives.slice(0, 6).join('\n- ') : 'Not provided';
    const sectionSummaries = sections.map(section => {
      const markdown = (section.content || [])
        .filter(cell => cell.cell_type === 'markdown')
        .map(cell => (Array.isArray(cell.source) ? cell.source.join('') : String(cell.source || '')))
        .join('\n')
        .slice(0, 800)
        .replace(/\s+/g, ' ')
        .trim();
      return `Section ${section.section_number}: ${section.title || 'Untitled'}\nExcerpt: ${markdown}`;
    }).join('\n\n');

    const notebookTitle = notebook?.metadata?.title || outline.title || 'Untitled Notebook';

    return `You are auditing a generated Jupyter notebook intended for production.
Notebook Title: ${notebookTitle}
Objectives:
- ${objectives}

Sections:
${sectionSummaries}

Tasks:
1. Identify any filler, placeholder, or repetitive content that indicates the model did not produce complete instructional material.
2. Flag missing explanations, undefined acronyms, or steps that simply restate the section title without depth.
3. Return a JSON object with fields:
{
  "status": "pass" | "warn" | "fail",
  "issues": ["..."],
  "filler_sections": ["Section N: reason"],
  "recommendations": ["actionable follow-ups"]
}
Status guidelines:
- "pass" when no issues are detected.
- "warn" when minor follow-up is recommended.
- "fail" when the notebook contains clear filler/incomplete sections.
Respond with JSON only.`;
  }

  private parseResponse(raw: string): Omit<SemanticReport, 'rawResponse'> {
    try {
      const json = JSON.parse(raw);
      return this.normalizeReport(json);
    } catch {
      const loose = extractJsonLoose(raw);
      if (loose) {
        return this.normalizeReport(loose as any);
      }
      return {
        status: 'warn',
        issues: ['Semantic QA returned an unparseable response.'],
        fillerSections: [],
        recommendations: ['Inspect notebook manually for filler content.']
      };
    }
  }

  private normalizeReport(data: any): Omit<SemanticReport, 'rawResponse'> {
    const status = (typeof data?.status === 'string' && ['pass', 'warn', 'fail'].includes(data.status))
      ? data.status as SemanticStatus
      : 'warn';
    const issues = Array.isArray(data?.issues) ? data.issues.map(String) : [];
    const fillerSections = Array.isArray(data?.filler_sections) ? data.filler_sections.map(String) : [];
    const recommendations = Array.isArray(data?.recommendations) ? data.recommendations.map(String) : [];
    return {
      status,
      issues,
      fillerSections,
      recommendations
    };
  }
}
