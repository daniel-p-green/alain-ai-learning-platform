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
}

export class ALAINKit {
  private outlineGenerator: OutlineGenerator;
  private sectionGenerator: SectionGenerator;
  private notebookBuilder: NotebookBuilder;
  private qualityValidator: QualityValidator;
  private colabValidator: ColabValidator;
  private baseUrl?: string;

  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl;
    this.outlineGenerator = new OutlineGenerator({ baseUrl: options.baseUrl });
    this.sectionGenerator = new SectionGenerator({ baseUrl: options.baseUrl });
    this.notebookBuilder = new NotebookBuilder();
    this.qualityValidator = new QualityValidator();
    this.colabValidator = new ColabValidator();
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
      title: string;
      description: string;
      difficulty: string;
      topics: string[];
      modelSpecificInstructions?: string;
    };
  }): Promise<ALAINKitResult> {
    try {
      // Step 1: Generate outline
      const outline = await this.outlineGenerator.generateOutline({
        model: config.modelReference,
        apiKey: config.apiKey,
        difficulty: config.difficulty || 'beginner',
        customPrompt: config.customPrompt
      });

      // Validate outline
      const outlineValidation = this.outlineGenerator.validateOutline(outline);
      if (!outlineValidation.isValid) {
        throw new Error(`Outline validation failed: ${outlineValidation.issues.join(', ')}`);
      }

      // Step 2: Generate sections
      const sections: GeneratedSection[] = [];
      const maxSections = Math.min(config.maxSections || outline.outline.length, outline.outline.length);
      
      for (let i = 0; i < maxSections; i++) {
        const section = await this.sectionGenerator.generateSection({
          outline,
          sectionNumber: i + 1,
          previousSections: sections,
          modelReference: config.modelReference,
          apiKey: config.apiKey,
          customPrompt: config.customPrompt
        });

        const sectionValidation = this.sectionGenerator.validateSection(section);
        if (sectionValidation.isValid) {
          sections.push(section);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Step 3: Build notebook
      let notebook = this.notebookBuilder.buildNotebook(outline, sections);

      // Step 4: Quality validation
      const tempPath = `/tmp/alain-notebook-${Date.now()}.ipynb`;
      require('fs').writeFileSync(tempPath, JSON.stringify(notebook, null, 2));
      const qualityMetrics = this.qualityValidator.validateNotebook(tempPath);

      // Step 5: Colab validation and fixes
      const colabValidation = this.colabValidator.validateNotebook(tempPath);
      if (!colabValidation.isCompatible && colabValidation.fixedNotebook) {
        notebook = colabValidation.fixedNotebook;
      }

      // Step 6: Generate validation report
      const validationReport = this.generateValidationReport(qualityMetrics, colabValidation);

      return {
        success: true,
        qualityScore: qualityMetrics.qualityScore,
        colabCompatible: colabValidation.isCompatible,
        notebook,
        outline,
        sections,
        qualityMetrics,
        colabValidation,
        validationReport
      };

    } catch (error) {
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
