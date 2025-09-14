import { extractJsonLoose } from './json-utils';

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

interface OutlineGeneratorOptions {
  baseUrl?: string;
}

export class OutlineGenerator {
  private baseUrl?: string;

  constructor(options: OutlineGeneratorOptions = {}) {
    this.baseUrl = options.baseUrl;
  }
  private readonly OPTIMAL_STEP_RANGE = [6, 15];
  private readonly TARGET_TOKEN_RANGE = [2000, 4000];
  private readonly SECTION_TOKEN_LIMIT = 1500;

  /**
   * Generate structured outline for a given model/topic
   */
  async generateOutline(options: {
    model: string;
    apiKey?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    customPrompt?: any;
  }): Promise<NotebookOutline> {
    const { model, apiKey, difficulty, customPrompt } = options;
    
    // Use this.baseUrl for local model inference if provided
    const endpoint = this.baseUrl || 'https://api.poe.com';
    
    const prompt = this.buildOutlinePrompt(model, difficulty);
    
    const response = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let outline = this.parseOutlineResponse(content);
    const validation = this.validateOutline(outline);
    if (!validation.isValid) {
      try {
        outline = await this.repairOutline(outline, validation.issues, { model, apiKey: apiKey || '', difficulty });
      } catch {
        // ignore and return best-effort
      }
    }
    return outline;
  }

  private buildOutlinePrompt(modelReference: string, difficulty: string): string {
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

RESPOND WITH ONLY THIS JSON STRUCTURE:
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
      "question": "MCQ question",
      "options": ["A", "B", "C", "D"],
      "correct_index": 0,
      "explanation": "detailed explanation"
    }
  ],
  "summary": "key takeaways",
  "next_steps": "suggested follow-up topics",
  "references": ["url1", "url2"],
  "estimated_total_tokens": 2500,
  "target_reading_time": "15-20 minutes"
}

Generate outline for: ${modelReference}`;
  }

  private parseOutlineResponse(content: string): NotebookOutline {
    try { return JSON.parse(content); } catch {}
    const loose = extractJsonLoose(content);
    if (loose) return loose as NotebookOutline;
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
    if (!outline.objectives || outline.objectives.length !== 4) {
      issues.push('Must have exactly 4 learning objectives');
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

    const resp = await fetch(`${endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ctx.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-oss-20b',
        messages: [{ role: 'user', content: repairPrompt }],
        temperature: 0.0,
        top_p: 1.0,
        max_tokens: 900,
        response_format: { type: 'json_object' }
      })
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || '';
    const repaired = this.parseOutlineResponse(content);
    return repaired;
  }
}
