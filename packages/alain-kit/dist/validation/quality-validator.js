import { readFileSync } from 'fs';
export class QualityValidator {
    constructor() {
        this.OPTIMAL_STEP_RANGE = [6, 15];
        this.OPTIMAL_MARKDOWN_RANGE = [0.4, 0.7];
        this.TARGET_TOKEN_RANGE = [2000, 4000];
        this.MIN_QUALITY_SCORE = 90;
    }
    /**
     * Validate notebook quality against standards
     */
    validateNotebook(notebookPath) {
        const notebook = readFileSync(notebookPath, 'utf8');
        const notebookData = JSON.parse(notebook);
        return this.analyzeNotebook(notebookData);
    }
    analyzeNotebook(notebook) {
        const cells = notebook.cells || [];
        let markdownCells = 0;
        let codeCells = 0;
        let totalTokens = 0;
        let stepCount = 0;
        const structure = {
            hasTitle: false,
            hasObjectives: false,
            hasSetup: false,
            hasAssessments: false
        };
        // Analyze each cell
        cells.forEach((cell) => {
            const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
            totalTokens += this.estimateTokens(source);
            if (cell.cell_type === 'markdown') {
                markdownCells++;
                // Check for structure elements
                if (source.match(/^#\s+/))
                    structure.hasTitle = true;
                if (source.toLowerCase().includes('objective'))
                    structure.hasObjectives = true;
                if (source.toLowerCase().includes('setup'))
                    structure.hasSetup = true;
                // Assessments detection: either explicit questions or the Knowledge Check block
                const lower = source.toLowerCase();
                if (lower.includes('question') || /knowledge\s*check/i.test(source)) {
                    structure.hasAssessments = true;
                }
                // Count both "Step N" and fallback "Section N" headings
                if (/^##\s+(Step|Section)\s+\d+/i.test(source))
                    stepCount++;
            }
            else if (cell.cell_type === 'code') {
                codeCells++;
                // Recognize MCQ helper usage as assessments signal
                const src = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
                if (/render_mcq\s*\(/.test(src) || /import\s+ipywidgets\s+as\s+widgets/.test(src)) {
                    structure.hasAssessments = true;
                }
            }
        });
        const markdownRatio = markdownCells / (markdownCells + codeCells);
        const qualityScore = this.calculateQualityScore({
            stepCount,
            markdownRatio,
            totalTokens,
            structure
        });
        return {
            qualityScore,
            stepCount,
            markdownRatio,
            estimatedTokens: totalTokens,
            estimatedReadingTime: this.calculateReadingTime(totalTokens),
            hasRequiredSections: Object.values(structure).every(v => v),
            meetsStandards: qualityScore >= this.MIN_QUALITY_SCORE
        };
    }
    calculateQualityScore(metrics) {
        let score = 0;
        // Structure scoring (40 points)
        if (metrics.structure.hasTitle)
            score += 10;
        if (metrics.structure.hasObjectives)
            score += 10;
        if (metrics.structure.hasSetup)
            score += 10;
        if (metrics.structure.hasAssessments)
            score += 10;
        // Step count scoring (20 points)
        if (metrics.stepCount >= this.OPTIMAL_STEP_RANGE[0] &&
            metrics.stepCount <= this.OPTIMAL_STEP_RANGE[1]) {
            score += 20;
        }
        else if (metrics.stepCount >= 3) {
            score += 10;
        }
        // Markdown ratio scoring (20 points)
        if (metrics.markdownRatio >= this.OPTIMAL_MARKDOWN_RANGE[0] &&
            metrics.markdownRatio <= this.OPTIMAL_MARKDOWN_RANGE[1]) {
            score += 20;
        }
        else if (metrics.markdownRatio >= 0.3 && metrics.markdownRatio <= 0.8) {
            score += 10;
        }
        // Token budget scoring (20 points)
        if (metrics.totalTokens >= this.TARGET_TOKEN_RANGE[0] &&
            metrics.totalTokens <= this.TARGET_TOKEN_RANGE[1]) {
            score += 20;
        }
        else if (metrics.totalTokens >= 1000 && metrics.totalTokens <= 6000) {
            score += 10;
        }
        return Math.min(100, score);
    }
    estimateTokens(text) {
        return Math.round(text.length / 4);
    }
    calculateReadingTime(tokens) {
        return Math.round((tokens / 200) * 10) / 10;
    }
    /**
     * Generate quality report
     */
    generateReport(metrics) {
        const status = metrics.meetsStandards ? '🎉 Excellent' : '⚠️ Needs improvement';
        return `# Quality Report

**Overall Score: ${metrics.qualityScore}/100** - ${status}

## Metrics
- Steps: ${metrics.stepCount} (optimal: ${this.OPTIMAL_STEP_RANGE[0]}-${this.OPTIMAL_STEP_RANGE[1]})
- Markdown Ratio: ${(metrics.markdownRatio * 100).toFixed(1)}%
- Tokens: ${metrics.estimatedTokens}
- Reading Time: ${metrics.estimatedReadingTime} minutes

## Status
${metrics.meetsStandards ?
            'Ready for production deployment!' :
            'Requires improvements to meet quality standards.'}`;
    }
}
//# sourceMappingURL=quality-validator.js.map