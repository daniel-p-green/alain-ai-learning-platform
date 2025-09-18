export class ValidatorToolController {
    constructor(deps) {
        this.deps = deps;
    }
    async runQaGate(payload) {
        this.deps.runtime?.logInvocation('validator.run_qa_gate', {
            sections: payload.sections.length
        });
        const report = await this.deps.qaGate.evaluate(payload);
        this.deps.runtime?.completeInvocation('validator.run_qa_gate', report.overall_status === 'fail' ? 'error' : 'ok', {
            overallStatus: report.overall_status,
            blockingIssues: report.blocking_issues.length,
            warningIssues: report.warning_issues.length
        });
        return report;
    }
    async runSemantic(payload) {
        this.deps.runtime?.logInvocation('validator.run_semantic', {
            model: payload.model || null
        });
        const report = await this.deps.semanticValidator.evaluate(payload);
        this.deps.runtime?.completeInvocation('validator.run_semantic', report.status === 'fail' ? 'error' : 'ok', {
            status: report.status,
            issues: report.issues.length
        });
        return report;
    }
    runQuality(notebookPath) {
        this.deps.runtime?.logInvocation('validator.run_quality', { notebookPath });
        const metrics = this.deps.qualityValidator.validateNotebook(notebookPath);
        this.deps.runtime?.completeInvocation('validator.run_quality', metrics.meetsStandards ? 'ok' : 'error', {
            qualityScore: metrics.qualityScore,
            meetsStandards: metrics.meetsStandards
        });
        return metrics;
    }
    async runColab(notebookPath) {
        this.deps.runtime?.logInvocation('validator.run_colab', { notebookPath });
        const result = await this.deps.colabValidator.validateNotebook(notebookPath);
        this.deps.runtime?.completeInvocation('validator.run_colab', result.isCompatible ? 'ok' : 'error', {
            issues: result.issues.length
        });
        return result;
    }
}
//# sourceMappingURL=validator-tool-controller.js.map