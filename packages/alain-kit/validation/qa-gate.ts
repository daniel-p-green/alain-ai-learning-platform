import { NotebookOutline } from '../core/outline-generator';
import { GeneratedSection } from '../core/section-generator';
import { createLogger } from '../core/obs';

export type QaGateStatus = 'pass' | 'warn' | 'fail';

/**
 * Provides lightweight structural checks before running the expensive
 * validation suite. The implementation is intentionally small and
 * deterministic so it is easy to reason about and extend.
 */
export interface QaGateReport {
  notebook_title: string;
  qa_timestamp: string;
  overall_status: QaGateStatus;
  summary: string;
  metrics: {
    outline_steps: number;
    sections_expected: number;
    sections_received: number;
    objectives_in_outline: number;
    exercises_count: number;
    assessments_count: number;
    avg_section_length_chars: number;
    markdown_ratio_estimate: number;
  };
  quality_gates: {
    outline_completeness: { status: QaGateStatus; notes: string[] };
    section_alignment: { status: QaGateStatus; notes: string[] };
    placeholder_scan: { status: QaGateStatus; notes: string[] };
  };
  blocking_issues: string[];
  warning_issues: string[];
  recommended_actions: {
    must_fix: string[];
    should_fix: string[];
  };
  automation_hooks: {
    regex_checks: string[];
  };
  source_trace: {
    outline_reference: string;
    section_ids: string[];
  };
}

interface QaGateInput {
  outline: NotebookOutline;
  sections: GeneratedSection[];
}

export class QaGate {
  private readonly log = createLogger('QaGate');

  async evaluate({ outline, sections }: QaGateInput): Promise<QaGateReport> {
    const outlineSteps = Array.isArray(outline?.outline) ? outline.outline.length : 0;
    const sectionsReceived = Array.isArray(sections) ? sections.length : 0;

    const blocking: string[] = [];
    const outlineWarnings: string[] = [];

    if (!outline?.title) {
      blocking.push('Outline is missing a title');
    }
    if (outlineSteps === 0) {
      blocking.push('Outline contains no steps');
    }
    if (!outline?.setup?.requirements?.length) {
      outlineWarnings.push('Setup requirements list is empty');
    }
    if (!outline?.summary || !outline?.next_steps) {
      outlineWarnings.push('Summary or next steps are missing from the outline');
    }
    if (!outline?.exercises?.length) {
      outlineWarnings.push('No exercises defined in outline');
    }

    const { sectionWarnings, avgMarkdownLength, markdownRatio } = this.inspectSections(outlineSteps, sections);
    const placeholderWarnings = this.scanPlaceholders(sections);

    const coverageWarnings: string[] = [];
    if (sectionsReceived === 0) {
      blocking.push('No generated sections found');
    } else if (sectionsReceived !== outlineSteps) {
      coverageWarnings.push(`Expected ${outlineSteps} sections but received ${sectionsReceived}`);
    }

    const allWarnings = [...outlineWarnings, ...sectionWarnings, ...placeholderWarnings, ...coverageWarnings];

    const overallStatus: QaGateStatus = blocking.length
      ? 'fail'
      : allWarnings.length
        ? 'warn'
        : 'pass';

    const report: QaGateReport = {
      notebook_title: outline?.title || 'Unknown Notebook',
      qa_timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      summary: this.buildSummary(overallStatus, blocking, allWarnings),
      metrics: {
        outline_steps: outlineSteps,
        sections_expected: outlineSteps,
        sections_received: sectionsReceived,
        objectives_in_outline: Array.isArray(outline?.objectives) ? outline.objectives.length : 0,
        exercises_count: Array.isArray(outline?.exercises) ? outline.exercises.length : 0,
        assessments_count: Array.isArray(outline?.assessments) ? outline.assessments.length : 0,
        avg_section_length_chars: avgMarkdownLength,
        markdown_ratio_estimate: Number(markdownRatio.toFixed(2))
      },
      quality_gates: {
        outline_completeness: {
          status: this.statusFor(blocking, outlineWarnings),
          notes: [...blocking.filter(msg => msg.includes('Outline')), ...outlineWarnings]
        },
        section_alignment: {
          status: this.statusFor(blocking.filter(msg => msg.includes('sections')), [...sectionWarnings, ...coverageWarnings]),
          notes: [...sectionWarnings, ...coverageWarnings]
        },
        placeholder_scan: {
          status: placeholderWarnings.length ? 'warn' : 'pass',
          notes: placeholderWarnings
        }
      },
      blocking_issues: blocking,
      warning_issues: allWarnings,
      recommended_actions: {
        must_fix: blocking,
        should_fix: allWarnings
      },
      automation_hooks: {
        regex_checks: ['(TODO|TBD|FIXME)']
      },
      source_trace: {
        outline_reference: 'qa.outline',
        section_ids: sections.map(section => `section-${section?.section_number ?? 'unknown'}`)
      }
    };

    this.log.info('qa_gate_result', {
      status: report.overall_status,
      outline_steps: outlineSteps,
      sections: sectionsReceived
    });

    return report;
  }

  private inspectSections(expectedSteps: number, sections: GeneratedSection[]) {
    if (!Array.isArray(sections) || !sections.length) {
      return { sectionWarnings: [] as string[], avgMarkdownLength: 0, markdownRatio: 0 };
    }

    let markdownChars = 0;
    let codeChars = 0;
    const perSectionLengths: number[] = [];
    const warnings: string[] = [];

    sections.forEach((section, index) => {
      let markdownLength = 0;
      let hasCode = false;
      section.content.forEach(cell => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source ?? '');
        if (cell.cell_type === 'markdown') {
          markdownChars += source.length;
          markdownLength += source.length;
        }
        if (cell.cell_type === 'code') {
          codeChars += source.length;
          hasCode = true;
        }
      });
      perSectionLengths.push(markdownLength);
      if (markdownLength < 800) {
        warnings.push(`Section ${index + 1} markdown body is shorter than 800 characters`);
      }
      if (!hasCode) {
        warnings.push(`Section ${index + 1} does not include a code cell`);
      }
    });

    if (sections.length < expectedSteps) {
      warnings.push('Not all outline steps currently have generated sections');
    }

    const totalChars = markdownChars + codeChars || 1;
    const averageLength = Math.round(perSectionLengths.reduce((sum, len) => sum + len, 0) / perSectionLengths.length);
    const markdownRatio = markdownChars / totalChars;

    return { sectionWarnings: warnings, avgMarkdownLength: averageLength, markdownRatio };
  }

  private scanPlaceholders(sections: GeneratedSection[]): string[] {
    const warnings: string[] = [];
    sections.forEach((section, index) => {
      section.content.forEach(cell => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source ?? '');
        if (/(TODO|TBD|FIXME)/i.test(source)) {
          warnings.push(`Placeholder text found in section ${index + 1}`);
        }
      });
    });
    return warnings;
  }

  private statusFor(blocking: string[], warnings: string[]): QaGateStatus {
    if (blocking.length) return 'fail';
    if (warnings.length) return 'warn';
    return 'pass';
  }

  private buildSummary(status: QaGateStatus, blocking: string[], warnings: string[]): string {
    if (status === 'fail') {
      return `QA gate failed: ${blocking.join('; ')}`;
    }
    if (status === 'warn') {
      return warnings.join('; ') || 'Passed with warnings.';
    }
    return 'QA gate passed.';
  }
}
