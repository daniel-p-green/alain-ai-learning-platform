/**
 * ALAIN-Kit Section Generator
 * 
 * Generates individual notebook sections with 800-1,500 token limit per section.
 * Ensures beginner-friendly content with executable code and proper structure.
 */
import { createLogger, timeIt, trackEvent, metrics } from './obs';

export interface NotebookCell {
  cell_type: 'markdown' | 'code';
  source: string;
}

export interface GeneratedSection {
  section_number: number;
  title: string;
  content: NotebookCell[];
  callouts: Array<{
    type: 'tip' | 'warning' | 'note';
    message: string;
  }>;
  estimated_tokens: number;
  prerequisites_check: string[];
  next_section_hint: string;
}

interface SectionGeneratorOptions {
  baseUrl?: string;
}

interface CustomPromptConfig {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface SectionGenerationOptions {
  outline: any; // TODO: Replace with proper NotebookOutline type
  sectionNumber: number;
  previousSections: GeneratedSection[];
  modelReference: string;
  apiKey?: string;
  customPrompt?: CustomPromptConfig;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export class SectionGenerator {
  private baseUrl?: string;
  private log = createLogger('SectionGenerator');

  constructor(options: SectionGeneratorOptions = {}) {
    this.baseUrl = options.baseUrl;
  }
  private readonly TOKEN_LIMIT = 1500;
  private readonly MIN_TOKENS = 800;

  /**
   * Generate content for a specific section
   */
  async generateSection(options: SectionGenerationOptions): Promise<GeneratedSection> {
    const op = 'generateSection';
    const started = Date.now();
    return await timeIt(`ALAINKit.${op}` as string, async () => {
    // Validate inputs
    if (!options.modelReference) {
      throw new Error('Model reference is required');
    }
    if (!options.apiKey) {
      throw new Error('API key is required');
    }
    if (typeof options.sectionNumber !== 'number' || options.sectionNumber < 1) {
      throw new Error('Valid section number is required');
    }
    const { outline, sectionNumber, previousSections, modelReference, apiKey, customPrompt } = options;
    const prompt = this.buildSectionPrompt(outline, sectionNumber, previousSections, modelReference);
    
    const endpoint = this.baseUrl || 'https://api.poe.com';
    
    let response: Response;
    let data: any;
    
    try {
      response = await fetch(`${endpoint}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelReference,
          messages: [{ role: 'user', content: prompt }],
          temperature: customPrompt?.temperature || 0.2,
          max_tokens: customPrompt?.maxTokens || this.TOKEN_LIMIT,
          // Prefer JSON mode for strict parsing when provider supports it
          response_format: { type: 'json_object' as const }
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      data = await response.json();
    } catch (error) {
      this.log.error('section_api_failed', { error: (error as any)?.message || String(error) });
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

  private buildSectionPrompt(
    outline: any, // TODO: Replace with proper NotebookOutline type
    sectionNumber: number,
    previousSections: GeneratedSection[],
    modelReference: string
  ): string {
    const currentStep = outline.outline?.[sectionNumber - 1] || {} as any;
    
    return `You are ALAIN-Teacher filling specific sections of educational notebooks. Generate content for the requested section only.

SECTION GENERATION RULES:
• Target ${this.MIN_TOKENS}-${this.TOKEN_LIMIT} tokens per section
• Use beginner-friendly ELI5 language with analogies
• Include executable code with comments
• Add callouts (💡 Tip, ⚠️ Warning, 📝 Note)
• Ensure reproducibility with seeds/versions
• Balance markdown explanation with hands-on code

CONTENT PATTERNS (from 575 notebook analysis):
• Short code cells (avoid mega-cells)
• Clear step transitions
• Setup commands with error handling
• Visual elements where helpful
• Practical examples over theory

RESPOND WITH ONLY THIS JSON STRUCTURE:
{
  "section_number": ${sectionNumber},
  "title": "${currentStep?.title || `Section ${sectionNumber}`}",
  "content": [
    {
      "cell_type": "markdown",
      "source": "## Step ${sectionNumber}: Title\\n\\nExplanation with analogies..."
    },
    {
      "cell_type": "code", 
      "source": "# Clear, commented code\\nprint('Hello World')"
    }
  ],
  "callouts": [
    {
      "type": "tip",
      "message": "💡 Helpful guidance"
    }
  ],
  "estimated_tokens": 1200,
  "prerequisites_check": ["item verified"],
  "next_section_hint": "brief preview of next step"
}

CONTEXT:
- Target Model: ${modelReference}
- Current Section: ${sectionNumber}
- Section Type: ${currentStep?.type || 'general'}
- Previous Sections: ${previousSections.length} completed

Generate content for section ${sectionNumber} only.`;
  }

  private parseSectionResponse(content: string, sectionNumber: number): GeneratedSection {
    try {
      return JSON.parse(content);
    } catch (e) {
      console.warn('Section JSON parse failed. Attempting loose extraction.');
      // Extract JSON boundaries
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          return JSON.parse(content.substring(jsonStart, jsonEnd + 1));
        } catch (e2) {
          // Fallback section if parsing fails
          return this.createFallbackSection(sectionNumber, content);
        }
      }
      
      return this.createFallbackSection(sectionNumber, content);
    }
  }

  private createFallbackSection(sectionNumber: number, content: string): GeneratedSection {
    // Create a basic fallback section when parsing fails
    return {
      section_number: sectionNumber,
      title: `Section ${sectionNumber}`,
      content: [
        {
          cell_type: 'markdown',
          source: `## Section ${sectionNumber}\n\n${content.substring(0, 500)}...`
        }
      ],
      callouts: [],
      estimated_tokens: 400,
      prerequisites_check: [],
      next_section_hint: 'Continue to next section'
    };
  }

  private async requestWithRetry(url: string, apiKey: string | undefined, body: any): Promise<string> {
    let attempt = 0;
    let delay = 500;
    while (true) {
      try {
        const started = Date.now();
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': apiKey ? `Bearer ${apiKey}` : '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty content');
        this.log.debug('section_request_success', { attempt: attempt + 1, duration_ms: Date.now() - started });
        return content as string;
      } catch (e) {
        attempt++;
        if (attempt > 3) throw e;
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
  validateSection(section: GeneratedSection): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!section?.content || !Array.isArray(section.content) || section.content.length === 0) {
      issues.push('Section has no content');
      return { isValid: false, issues };
    }

    if (typeof section.estimated_tokens === 'number') {
      if (section.estimated_tokens > this.TOKEN_LIMIT) {
        issues.push(`Section exceeds token limit (${section.estimated_tokens} > ${this.TOKEN_LIMIT})`);
      }

      if (section.estimated_tokens < this.MIN_TOKENS) {
        issues.push(`Section below minimum tokens (${section.estimated_tokens} < ${this.MIN_TOKENS})`);
      }
    }

    const hasMarkdown = section.content.some(cell => cell?.cell_type === 'markdown');
    const hasCode = section.content.some(cell => cell?.cell_type === 'code');
    
    if (!hasMarkdown) issues.push('Section missing explanatory content');
    if (!hasCode) issues.push('Section missing code examples');

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
