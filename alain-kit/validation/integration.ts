/**
 * ALAIN-Kit Integration
 * 
 * Main entry point that orchestrates outline generation, section filling,
 * notebook building, and validation in a single pipeline.
 */

import { OutlineGenerator, NotebookOutline } from '../core/outline-generator';
import { SectionGenerator, GeneratedSection } from '../core/section-generator';
import { NotebookBuilder } from '../core/notebook-builder';
import { QualityValidator, QualityMetrics } from './quality-validator';
import { ColabValidator, ColabValidationResult } from './colab-validator';
import { metrics, trackEvent } from '../core/obs';

export interface ALAINKitResult {
  success: boolean;
  qualityScore: number;
  colabCompatible: boolean;
  notebook: any;
  outline: NotebookOutline;
  sections: GeneratedSection[];
  qualityMetrics: QualityMetrics;
  colabValidation: ColabValidationResult;
  validationReport: string;
  phaseTimings?: {
    outline_ms: number;
    sections_ms_total: number;
    section_ms: number[];
    build_ms: number;
    quality_ms: number;
    colab_ms: number;
    total_ms: number;
  };
}

export class ALAINKit {
  private outlineGenerator: OutlineGenerator;
  private sectionGenerator: SectionGenerator;
  private notebookBuilder: NotebookBuilder;
  private qualityValidator: QualityValidator;
  private colabValidator: ColabValidator;
  private baseUrl?: string;
  private checkpointsDir: string;

  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl;
    this.outlineGenerator = new OutlineGenerator({ baseUrl: options.baseUrl });
    this.sectionGenerator = new SectionGenerator({ baseUrl: options.baseUrl });
    this.notebookBuilder = new NotebookBuilder();
    this.qualityValidator = new QualityValidator();
    this.colabValidator = new ColabValidator();
    // Checkpoint directory: allow resume across runs when ALAIN_CHECKPOINT_DIR is set
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.checkpointsDir = process.env.ALAIN_CHECKPOINT_DIR || `/tmp/alain-kit-${stamp}`;
    try { require('fs').mkdirSync(this.checkpointsDir, { recursive: true }); } catch {}
  }

  /**
   * Generate complete notebook with validation
   */
  async generateNotebook(config: {
    modelReference: string;
    apiKey?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    maxSections?: number;
    customPrompt?: {
      title?: string;
      description?: string;
      difficulty?: 'beginner' | 'intermediate' | 'advanced';
      topics?: string[];
      context?: string;
      modelSpecificInstructions?: string;
      temperature?: number;
      maxTokens?: number;
    };
  }): Promise<ALAINKitResult> {
    const pipelineStart = Date.now();
    try {
      const isLocalProvider = !!this.baseUrl && (/localhost|127\.0\.0\.1/i.test(this.baseUrl));
      const apiKeyOrLocal = isLocalProvider ? (config.apiKey || 'local') : (config.apiKey || '');
      // Step 1: Generate outline
      const tOutlineStart = Date.now();
      const outline = await this.outlineGenerator.generateOutline({
        model: config.modelReference,
        apiKey: apiKeyOrLocal,
        difficulty: config.difficulty || 'beginner',
        customPrompt: config.customPrompt
      });
      const tOutline = Date.now() - tOutlineStart;

      // Validate outline
      const outlineValidation = this.outlineGenerator.validateOutline(outline);
      if (!outlineValidation.isValid) {
        throw new Error(`Outline validation failed: ${outlineValidation.issues.join(', ')}`);
      }

      // Step 2: Generate sections (checkpoint + bounded concurrency)
      const fs = require('fs');
      const path = require('path');
      const sectionsDir = path.join(this.checkpointsDir, 'sections');
      try { fs.mkdirSync(sectionsDir, { recursive: true }); } catch {}
      const completed = new Set<number>();
      for (const f of (fs.existsSync(sectionsDir) ? fs.readdirSync(sectionsDir) : [])) {
        const m = f.match(/^(\d+)\.json$/);
        if (m) completed.add(Number(m[1]));
      }
      const maxSections = Math.min(config.maxSections || outline.outline.length, outline.outline.length);
      const sections: Array<GeneratedSection | undefined> = new Array(maxSections).fill(undefined);
      const sectionDurations: number[] = [];
      // Preload any saved sections (resume)
      for (const idx of Array.from(completed).sort((a,b)=>a-b)) {
        if (idx >= 1 && idx <= maxSections) {
          try {
            const rec = JSON.parse(fs.readFileSync(path.join(sectionsDir, `${idx}.json`), 'utf-8'));
            sections[idx - 1] = rec;
          } catch {}
        }
      }
      const isLocal = !!this.baseUrl && (/localhost|127\.0\.0\.1/.test(this.baseUrl));
      const maxConcurrency = Number(process.env.ALAIN_CONCURRENCY || (isLocal ? 2 : 1));
      const tasks: Array<() => Promise<void>> = [];
      for (let i = 0; i < maxSections; i++) {
        const sectionNumber = i + 1;
        if (completed.has(sectionNumber)) continue;
        tasks.push(async () => {
          const fn = async () => {
            const secStart = Date.now();
            const previousSections = sections.slice(0, sectionNumber - 1).filter((s): s is GeneratedSection => !!s);
            const section = await this.sectionGenerator.generateSection({
              outline,
              sectionNumber,
              previousSections,
              modelReference: config.modelReference,
              apiKey: apiKeyOrLocal,
              customPrompt: config.customPrompt,
              difficulty: config.difficulty || 'beginner'
            });
            const secDur = Date.now() - secStart;
            try { sectionDurations.push(secDur); } catch {}
            const v = this.sectionGenerator.validateSection(section);
            if (!v.isValid) {
              throw new Error(`Section ${sectionNumber} failed validation: ${v.issues.join(', ')}`);
            }
            sections[sectionNumber - 1] = section;
            // Save checkpoint
            try { fs.writeFileSync(path.join(sectionsDir, `${sectionNumber}.json`), JSON.stringify(section, null, 2)); } catch {}
          };
          await this.attemptWithBackoff(fn, 3);
        });
      }
      const tSectionsStart = Date.now();
      await this.runPool(tasks, maxConcurrency);
      const tSectionsTotal = Date.now() - tSectionsStart;

      const orderedSections = sections.slice(0, maxSections);
      const missing = orderedSections
        .map((section, index) => (section ? null : index + 1))
        .filter((value): value is number => value !== null);
      if (missing.length > 0) {
        throw new Error(`Section generation incomplete. Missing sections: ${missing.join(', ')}`);
      }
      const resolvedSections = orderedSections as GeneratedSection[];

      // Step 3: Build notebook
      const tBuildStart = Date.now();
      let notebook = this.notebookBuilder.buildNotebook(outline, resolvedSections);
      const tBuild = Date.now() - tBuildStart;

      // Step 4: Quality validation
      const tempPath = `/tmp/alain-notebook-${Date.now()}.ipynb`;
      require('fs').writeFileSync(tempPath, JSON.stringify(notebook, null, 2));
      const tQualityStart = Date.now();
      const qualityMetrics = this.qualityValidator.validateNotebook(tempPath);
      const tQuality = Date.now() - tQualityStart;

      // Step 5: Colab validation and fixes
      const tColabStart = Date.now();
      const colabValidation = await this.colabValidator.validateNotebook(tempPath);
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

    } catch (error) {
      const duration = Date.now() - pipelineStart;
      metrics.inc('alain_pipeline_failures_total', 1, { model: config.modelReference, difficulty: config.difficulty || 'beginner' });
      trackEvent('alain_pipeline_failure', { model: config.modelReference, difficulty: config.difficulty || 'beginner', duration_ms: duration, error: (error as any)?.message });
      return {
        success: false,
        qualityScore: 0,
        colabCompatible: false,
        notebook: null,
        outline: {} as NotebookOutline,
        sections: [],
        qualityMetrics: {} as QualityMetrics,
        colabValidation: {} as ColabValidationResult,
        validationReport: `Generation failed: ${error.message}`
      };
    }
  }

  private generateValidationReport(quality: QualityMetrics, colab: ColabValidationResult): string {
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

  // --- Concurrency + backoff helpers ---
  private async runPool(tasks: Array<() => Promise<void>>, limit: number): Promise<void> {
    const q = tasks.slice();
    const n = Math.min(Math.max(1, limit), Math.max(1, q.length));
    const worker = async () => {
      while (q.length) {
        const t = q.shift();
        if (!t) break;
        await t();
      }
    };
    await Promise.all(Array.from({ length: n }, worker));
  }

  private async attemptWithBackoff(fn: () => Promise<void>, retries: number): Promise<void> {
    let attempt = 0;
    let delay = 500;
    while (true) {
      try {
        await fn();
        return;
      } catch (e) {
        attempt++;
        if (attempt > retries) throw e;
        const jitter = Math.round(delay * (0.8 + Math.random() * 0.4));
        await new Promise(r => setTimeout(r, jitter));
        delay = Math.min(5000, delay * 2);
      }
    }
  }
}

/**
 * Simple usage example
 */
export async function generateNotebook(options: {
  modelReference: string;
  apiKey?: string;
  baseUrl?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  maxSections?: number;
  customPrompt?: {
    title: string;
    description: string;
    difficulty: string;
    topics: string[];
    modelSpecificInstructions?: string;
  };
}) {
  const alainKit = new ALAINKit({ baseUrl: options.baseUrl });
  
  return await alainKit.generateNotebook({
    modelReference: options.modelReference,
    apiKey: options.apiKey,
    difficulty: options.difficulty || 'beginner',
    maxSections: options.maxSections || 5,
    customPrompt: options.customPrompt
  });
}
