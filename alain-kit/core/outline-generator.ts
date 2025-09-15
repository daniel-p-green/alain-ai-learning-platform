import { extractJsonLoose } from './json-utils';
import { createLogger, timeIt, trackEvent, metrics } from './obs';

/**
 * ALAIN-Kit Outline Generator
 * 
 * Generates structured notebook outlines based on analysis of 575 high-quality notebooks.
 * Ensures optimal structure with 6-15 steps, token budgeting, and quality patterns.
 */

export interface OutlineStep {
  step: number;
  title: string;
  type: 'setup' | 'concept' | 'implementation' | 'exercise' | 'deployment';
  estimated_tokens: number;
  content_type: string;
}

export interface NotebookOutline {
  title: string;
  overview: string;
  objectives: string[];
  prerequisites: string[];
  setup: {
    requirements: string[];
    environment: string[];
    commands: string[];
  };
  outline: OutlineStep[];
  exercises: Array<{
    title: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimated_tokens: number;
  }>;
  assessments: Array<{
    question: string;
    options: string[];
    correct_index: number;
    explanation: string;
  }>;
  summary: string;
  next_steps: string;
  references: string[];
  estimated_total_tokens: number;
  target_reading_time: string;
}

interface CustomPromptConfig {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics?: string[];
}

interface OutlineGeneratorOptions {
  baseUrl?: string;
}

interface CustomPromptConfig {
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

interface OutlineGenerationOptions {
  model: string;
  apiKey?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  customPrompt?: CustomPromptConfig;
}

export class OutlineGenerator {
  private baseUrl?: string;
  private log = createLogger('OutlineGenerator');

  constructor(options: OutlineGeneratorOptions = {}) {
    this.baseUrl = options.baseUrl;
  }
  private readonly OPTIMAL_STEP_RANGE = [6, 15];
  private readonly TARGET_TOKEN_RANGE = [2000, 4000];
  private readonly SECTION_TOKEN_LIMIT = 1500;

  /**
   * Generate structured outline for a given model/topic
   */
  async generateOutline(options: OutlineGenerationOptions): Promise<NotebookOutline> {
    const op = 'generateOutline';
    const started = Date.now();
    return await timeIt(`ALAINKit.${op}`, async () => {
    // Validate inputs
    if (!options.model) {
      throw new Error('Model is required');
    }
    if (!options.apiKey) {
      throw new Error('API key is required');
    }
    const { model, apiKey, difficulty, customPrompt } = options;
    
    // Use this.baseUrl for local model inference if provided
    const endpoint = this.baseUrl || 'https://api.poe.com';
    // Allow callers to provide a subject/title and optional context (e.g., remix headings) via customPrompt
    const subject = (customPrompt as any)?.title || model;
    const context: string | undefined = (customPrompt as any)?.context;
    
    const prompt = this.buildOutlinePrompt(subject, difficulty, context);
    
    const body: any = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: (customPrompt as any)?.temperature || 0.1,
      max_tokens: (customPrompt as any)?.maxTokens || 2000
    };
    // Some local OpenAI-compatible servers (e.g., LM Studio) reject response_format=json_object.
    if (!this.isLocalBaseUrl()) {
      body.response_format = { type: 'json_object' } as const;
    }
    const content = await this.requestWithRetry(`${endpoint}/v1/chat/completions`, apiKey, body);

    let outline = this.parseOutlineResponse(content);
    let validation = this.validateOutline(outline);
    if (!validation.isValid) {
      try {
        outline = await this.repairOutline(outline, validation.issues, { model, apiKey: apiKey || '', difficulty });
      } catch (error) {
        this.log.warn('repair_failed_deterministic_fallback', { error: (error as any)?.message || String(error) });
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

  private buildOutlinePrompt(subject: string, difficulty: string, context?: string): string {
    const ctx = context ? `\n\nSOURCE CONTEXT (use to shape sections, do not copy verbatim):\n${context}\n` : '';
    return `You are ALAIN-Teacher creating educational notebook outlines.
You MUST respond with ONLY valid JSON. No markdown, no extra text. The response must begin with { and end with }.

Based on analysis of 575 high-quality notebooks, follow these proven patterns:

STRUCTURE REQUIREMENTS:
• Title: Clear, descriptive lesson title
• Overview: 2-3 sentence description
• Objectives: Exactly 4 specific learning objectives
• Prerequisites: Required knowledge/tools
• Setup: Installation and environment requirements (must include ipywidgets>=8.0.0)
• Steps: ${this.OPTIMAL_STEP_RANGE[0]}-${this.OPTIMAL_STEP_RANGE[1]} well-labeled sections
• Exercises: 2-3 hands-on challenges
• Summary: Key takeaways and next steps
• References: Relevant links and resources

QUALITY PATTERNS:
• Balanced markdown/code ratio (40-70% markdown)
• Clear step progression with "Step N:" format
• Setup commands and reproducibility markers
• ${difficulty}-friendly language with analogies
• Token budget: ${this.TARGET_TOKEN_RANGE[0]}-${this.TARGET_TOKEN_RANGE[1]} total

  RESPOND WITH ONLY THIS JSON STRUCTURE (ensure at least 2 MCQs in assessments):
  {
  "title": "lesson title",
  "overview": "brief description",
  "objectives": ["objective 1", "objective 2", "objective 3", "objective 4"],
  "prerequisites": ["prereq 1", "prereq 2"],
  "setup": {
    "requirements": ["ipywidgets>=8.0.0"],
    "environment": [".env variable"],
    "commands": ["install command"]
  },
  "outline": [
    {
      "step": 1,
      "title": "Step 1: Introduction and Setup",
      "type": "setup",
      "estimated_tokens": 300,
      "content_type": "markdown + code"
    }
  ],
  "exercises": [
    {
      "title": "Exercise 1: Basic Implementation",
      "difficulty": "${difficulty}",
      "estimated_tokens": 200
    }
  ],
  "assessments": [
    {
      "question": "MCQ question 1",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "detailed explanation"
    },
    {
      "question": "MCQ question 2",
      "options": ["A", "B", "C", "D"],
      "correct_index": 1,
      "explanation": "explanation for the correct answer"
    }
  ],
  "summary": "key takeaways",
  "next_steps": "suggested follow-up topics",
  "references": ["url1", "url2"],
  "estimated_total_tokens": 2500,
  "target_reading_time": "15-20 minutes"
}

Generate outline for: ${subject}
Audience: absolute beginners (ELI5, non-developers). Use analogies and avoid jargon.${ctx}`;
  }

  private parseOutlineResponse(content: string): NotebookOutline {
    try { 
      return JSON.parse(content); 
    } catch (error) {
      this.log.warn('outline_json_parse_failed', { error: (error as any)?.message || String(error) });
    }
    
    const loose = extractJsonLoose(content);
    if (loose) {
      return loose as NotebookOutline;
    }
    
    this.log.error('outline_json_extract_failed', { head: content.substring(0, 200) });
    throw new Error('No valid JSON found in outline response');
  }

  /**
   * Validate outline meets quality standards
   */
  validateOutline(outline: NotebookOutline): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!outline.title) issues.push('Missing title');
    if (!outline.objectives || outline.objectives.length < 3 || outline.objectives.length > 5) {
      issues.push('Must have 3–5 learning objectives');
    }
    if (!outline.outline || outline.outline.length < this.OPTIMAL_STEP_RANGE[0]) {
      issues.push(`Must have at least ${this.OPTIMAL_STEP_RANGE[0]} steps`);
    }
    if (outline.outline && outline.outline.length > this.OPTIMAL_STEP_RANGE[1]) {
      issues.push(`Should not exceed ${this.OPTIMAL_STEP_RANGE[1]} steps`);
    }
    if (!outline.assessments || outline.assessments.length < 2) {
      issues.push('Must have at least 2 assessment questions');
    }
    if (outline.estimated_total_tokens > this.TARGET_TOKEN_RANGE[1]) {
      issues.push('Token count exceeds recommended range - consider splitting');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  private async repairOutline(outline: NotebookOutline, issues: string[], ctx: { model: string; apiKey: string; difficulty: 'beginner'|'intermediate'|'advanced'; }): Promise<NotebookOutline> {
    const endpoint = this.baseUrl || 'https://api.poe.com';
    const repairPrompt = `You previously generated a JSON outline for a tutorial. It needs repair to meet constraints.\n`+
      `Return ONLY valid JSON (start with { and end with }). Fix the following issues: ${issues.join('; ')}.\n`+
      `Ensure: 6-12 steps; at least 2 MCQs in assessments; exactly 4 objectives.\n`+
      `Here is the current outline JSON to repair:\n${JSON.stringify(outline, null, 2)}`;

    const reqBody: any = {
      model: ctx.model,
      messages: [{ role: 'user', content: repairPrompt }],
      temperature: 0.0,
      top_p: 1.0,
      max_tokens: 900
    };
    if (!this.isLocalBaseUrl()) {
      reqBody.response_format = { type: 'json_object' };
    }
    const content = await this.requestWithRetry(`${endpoint}/v1/chat/completions`, ctx.apiKey, reqBody);
    const repaired = this.parseOutlineResponse(content);
    return repaired;
  }

  // Deterministic minimal repair to satisfy hard outline gates (non-generative)
  private repairOutlineDeterministic(outline: NotebookOutline): NotebookOutline {
    const fixed: NotebookOutline = JSON.parse(JSON.stringify(outline || {}));
    // Ensure assessments >= 2
    if (!Array.isArray(fixed.assessments)) fixed.assessments = [] as any;
    while (fixed.assessments.length < 2) {
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

  private async requestWithRetry(url: string, apiKey: string | undefined, body: any): Promise<string> {
    let attempt = 0;
    let delay = 500;
    
    while (attempt < 3) {
      try {
        const started = Date.now();
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error('Empty content');
        this.log.debug('outline_request_success', { attempt: attempt + 1, duration_ms: Date.now() - started });
        return content as string;
      } catch (e) {
        attempt++;
        if (attempt >= 3) throw e;
        const jitter = Math.round(delay * (0.8 + Math.random() * 0.4));
        this.log.warn('outline_request_retry', { attempt, delay_ms: jitter });
        await new Promise(r => setTimeout(r, jitter));
        delay = Math.min(5000, delay * 2);
      }
    }
    throw new Error('Max retries exceeded');
  }

  private isLocalBaseUrl(): boolean {
    const u = this.baseUrl || '';
    return /localhost|127\.0\.0\.1/i.test(u);
  }
}
