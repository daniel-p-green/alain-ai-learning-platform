import { QaGate, QaGateReport } from '../validation/qa-gate.js';
import { SemanticValidator, SemanticReport } from '../validation/semantic-validator.js';
import { QualityValidator, QualityMetrics } from '../validation/quality-validator.js';
import { ColabValidator, ColabValidationResult } from '../validation/colab-validator.js';
import { HarmonyStubRuntime } from './tool-runtime.js';
import { NotebookOutline } from './outline-generator.js';
import { GeneratedSection } from './section-generator.js';

interface ValidatorDeps {
  qaGate: QaGate;
  semanticValidator: SemanticValidator;
  qualityValidator: QualityValidator;
  colabValidator: ColabValidator;
  runtime?: HarmonyStubRuntime;
}

export class ValidatorToolController {
  constructor(private readonly deps: ValidatorDeps) {}

  async runQaGate(payload: {
    outline: NotebookOutline;
    sections: GeneratedSection[];
    notebook: any;
  }): Promise<QaGateReport> {
    this.deps.runtime?.logInvocation('validator.run_qa_gate', {
      sections: payload.sections.length
    });
    const report = await this.deps.qaGate.evaluate(payload);
    this.deps.runtime?.completeInvocation(
      'validator.run_qa_gate',
      report.overall_status === 'fail' ? 'error' : 'ok',
      {
        overallStatus: report.overall_status,
        blockingIssues: report.blocking_issues.length,
        warningIssues: report.warning_issues.length
      }
    );
    return report;
  }

  async runSemantic(payload: {
    outline: NotebookOutline;
    sections: GeneratedSection[];
    notebook: any;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
  }): Promise<SemanticReport> {
    this.deps.runtime?.logInvocation('validator.run_semantic', {
      model: payload.model || null
    });
    const report = await this.deps.semanticValidator.evaluate(payload);
    this.deps.runtime?.completeInvocation(
      'validator.run_semantic',
      report.status === 'fail' ? 'error' : 'ok',
      {
        status: report.status,
        issues: report.issues.length
      }
    );
    return report;
  }

  runQuality(notebookPath: string): QualityMetrics {
    this.deps.runtime?.logInvocation('validator.run_quality', { notebookPath });
    const metrics = this.deps.qualityValidator.validateNotebook(notebookPath);
    this.deps.runtime?.completeInvocation('validator.run_quality', metrics.meetsStandards ? 'ok' : 'error', {
      qualityScore: metrics.qualityScore,
      meetsStandards: metrics.meetsStandards
    });
    return metrics;
  }

  async runColab(notebookPath: string): Promise<ColabValidationResult> {
    this.deps.runtime?.logInvocation('validator.run_colab', { notebookPath });
    const result = await this.deps.colabValidator.validateNotebook(notebookPath);
    this.deps.runtime?.completeInvocation('validator.run_colab', result.isCompatible ? 'ok' : 'error', {
      issues: result.issues.length
    });
    return result;
  }
}
