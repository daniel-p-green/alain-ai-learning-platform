/**
 * ALAIN-Kit Section Generator
 * 
 * Generates individual notebook sections with 800-1,500 token limit per section.
 * Ensures beginner-friendly content with executable code and proper structure.
 */

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

export class SectionGenerator {
  private baseUrl?: string;

  constructor(options: SectionGeneratorOptions = {}) {
    this.baseUrl = options.baseUrl;
  }
  private readonly TOKEN_LIMIT = 1500;
  private readonly MIN_TOKENS = 800;

  /**
   * Generate content for a specific section
   */
  async generateSection(options: {
    outline: any;
    sectionNumber: number;
    previousSections: GeneratedSection[];
    modelReference: string;
    apiKey?: string;
    customPrompt?: any;
  }): Promise<GeneratedSection> {
    const { outline, sectionNumber, previousSections, modelReference, apiKey, customPrompt } = options;
    const prompt = this.buildSectionPrompt(outline, sectionNumber, previousSections, modelReference);
    
    const endpoint = this.baseUrl || 'https://api.poe.com';
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: this.TOKEN_LIMIT
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    return this.parseSectionResponse(content, sectionNumber);
  }

  private buildSectionPrompt(
    outline: any,
    sectionNumber: number,
    previousSections: GeneratedSection[],
    modelReference: string
  ): string {
    const currentStep = outline.outline[sectionNumber - 1];
    
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
    const endpoint = this.baseUrl || 'https://api.poe.com';
    // Implementation here - use endpoint for API calls
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

  /**
   * Validate section meets quality standards
   */
  validateSection(section: GeneratedSection): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!section.content || section.content.length === 0) {
      issues.push('Section has no content');
    }

    if (section.estimated_tokens > this.TOKEN_LIMIT) {
      issues.push(`Section exceeds token limit (${section.estimated_tokens} > ${this.TOKEN_LIMIT})`);
    }

    if (section.estimated_tokens < this.MIN_TOKENS) {
      issues.push(`Section below minimum tokens (${section.estimated_tokens} < ${this.MIN_TOKENS})`);
    }

    const hasMarkdown = section.content.some(cell => cell.cell_type === 'markdown');
    const hasCode = section.content.some(cell => cell.cell_type === 'code');
    
    if (!hasMarkdown) issues.push('Section missing explanatory content');
    if (!hasCode) issues.push('Section missing code examples');

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
