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
export declare class ValidatorToolController {
    private readonly deps;
    constructor(deps: ValidatorDeps);
    runQaGate(payload: {
        outline: NotebookOutline;
        sections: GeneratedSection[];
        notebook: any;
    }): Promise<QaGateReport>;
    runSemantic(payload: {
        outline: NotebookOutline;
        sections: GeneratedSection[];
        notebook: any;
        apiKey?: string;
        baseUrl?: string;
        model?: string;
    }): Promise<SemanticReport>;
    runQuality(notebookPath: string): QualityMetrics;
    runColab(notebookPath: string): Promise<ColabValidationResult>;
}
export {};
//# sourceMappingURL=validator-tool-controller.d.ts.map