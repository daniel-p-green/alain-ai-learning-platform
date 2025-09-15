/**
 * ALAIN-Kit Notebook Builder
 * 
 * Assembles final Jupyter notebooks from outline and sections.
 * Ensures proper structure and Colab compatibility.
 */

import { NotebookOutline } from './outline-generator';
import { GeneratedSection } from './section-generator';
import { createLogger, trackEvent } from './obs';

export interface Assessment {
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface Setup {
  requirements?: string[];
}

export interface JupyterNotebook {
  cells: Array<{
    cell_type: 'markdown' | 'code';
    metadata: {};
    source: string[];
  }>;
  metadata: {
    kernelspec: {
      display_name: string;
      language: string;
      name: string;
    };
    language_info: {
      name: string;
      version: string;
    };
    alain?: {
      schemaVersion: string;
      createdAt: string;
      title?: string;
      builder?: { name: string; version?: string };
    };
  };
  nbformat: number;
  nbformat_minor: number;
}

export class NotebookBuilder {
  private log = createLogger('NotebookBuilder');
  /**
   * Build complete Jupyter notebook from outline and sections
   */
  buildNotebook(outline: NotebookOutline, sections: GeneratedSection[]): JupyterNotebook {
    const started = Date.now();
    // Validate inputs
    if (!outline?.title || !outline.overview) {
      throw new Error('Invalid outline: missing title or overview');
    }
    if (!Array.isArray(sections)) {
      throw new Error('Sections must be an array');
    }
    const cells: Array<{ cell_type: 'markdown' | 'code'; metadata: {}; source: string[] }> = [];

    // Environment detection cell (Colab compatibility)
    cells.push(this.createEnvironmentCell());

    // Title and overview
    cells.push(this.createTitleCell(outline.title, outline.overview));

    // Learning objectives
    cells.push(this.createObjectivesCell(outline.objectives));

    // Prerequisites
    if (outline.prerequisites?.length > 0) {
      cells.push(this.createPrerequisitesCell(outline.prerequisites));
    }

    // Setup section
    if (outline.setup) {
      const setupCells = this.createSetupCells(outline.setup);
      setupCells.forEach(cell => cells.push(cell));
    }

    // Ensure ipywidgets is available for interactive MCQs
    cells.push({
      cell_type: "code" as const,
      metadata: {},
      source: [
        "# Ensure ipywidgets is installed for interactive MCQs\n",
        "try:\n",
        "    import ipywidgets  # type: ignore\n",
        "    print('ipywidgets available')\n",
        "except Exception:\n",
        "    import sys, subprocess\n",
        "    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'ipywidgets>=8.0.0'])\n"
      ],
      execution_count: null as any,
      outputs: [] as any[]
    } as any);

    // Generated sections
    sections.forEach(section => {
      section.content.forEach(cell => {
        const obj: any = {
          cell_type: cell.cell_type,
          metadata: {},
          source: this.formatCellSource(cell.source)
        };
        if (cell.cell_type === 'code') {
          obj.execution_count = null;
          obj.outputs = [];
        }
        cells.push(obj);
      });
    });

    // Assessments (interactive)
    if (outline.assessments?.length > 0) {
      const asses = this.createAssessmentsCells(outline.assessments);
      asses.forEach(c => cells.push(c));
    }

    // Troubleshooting guide
    cells.push(this.createTroubleshootingCell());

    const createdAt = new Date().toISOString();
    const nb = {
      cells,
      metadata: {
        kernelspec: {
          display_name: "Python 3",
          language: "python",
          name: "python3"
        },
        language_info: {
          name: "python",
          version: "3"
        },
        alain: {
          schemaVersion: "1.0.0",
          createdAt,
          title: outline.title,
          builder: { name: "alain-kit", version: "0.1.0" }
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };
    const dur = Date.now() - started;
    try { trackEvent('alain_notebook_built', { cells: cells.length, sections: sections.length, duration_ms: dur }); } catch {}
    this.log.info('timing', { op: 'buildNotebook', duration_ms: dur, cells: cells.length, sections: sections.length });
    return nb;
  }

  private createEnvironmentCell() {
    return {
      cell_type: "code" as const,
      metadata: {},
      source: [
        "# 🔧 Environment Detection and Setup\n",
        "import sys\n",
        "import os\n",
        "\n",
        "# Detect environment\n",
        "IN_COLAB = 'google.colab' in sys.modules\n",
        "print(f'Environment: {\"Google Colab\" if IN_COLAB else \"Local\"}')\n",
        "\n",
        "# Setup environment-specific configurations\n",
        "if IN_COLAB:\n",
        "    print('📝 Colab-specific optimizations enabled')\n",
        "    try:\n",
        "        from google.colab import output\n",
        "        output.enable_custom_widget_manager()\n",
        "    except Exception:\n",
        "        pass\n"
      ],
      execution_count: null as any,
      outputs: [] as any[]
    };
  }

  private createTitleCell(title: string, overview: string) {
    return {
      cell_type: "markdown" as const,
      metadata: {},
      source: [`# ${title}\n\n${overview}`]
    };
  }

  private createObjectivesCell(objectives: string[]) {
    return {
      cell_type: "markdown" as const,
      metadata: {},
      source: [
        "## Learning Objectives\n\n",
        "By the end of this tutorial, you will be able to:\n\n",
        ...objectives.map((obj, i) => `${i + 1}. ${obj}\n`)
      ]
    };
  }

  private createPrerequisitesCell(prerequisites: string[]) {
    return {
      cell_type: "markdown" as const,
      metadata: {},
      source: [
        "## Prerequisites\n\n",
        ...prerequisites.map(prereq => `- ${prereq}\n`)
      ]
    };
  }

  private createSetupCells(setup: Setup): Array<{ cell_type: 'markdown' | 'code'; metadata: {}; source: string[] }> {
    const cells: Array<{ cell_type: 'markdown' | 'code'; metadata: {}; source: string[] }> = [
      {
        cell_type: "markdown" as const,
        metadata: {},
        source: ["## Setup\n\nLet's install the required packages and set up our environment.\n"]
      }
    ];

    if (setup.requirements && setup.requirements.length > 0) {
      cells.push({
        cell_type: "code" as const,
        metadata: {},
        source: [
          "# Install packages (Colab-compatible)\n",
          "# Check if we're in Colab\n",
          "import sys\n",
          "IN_COLAB = 'google.colab' in sys.modules\n",
          "\n",
          "if IN_COLAB:\n",
          `    !pip install -q ${setup.requirements.join(' ')}\n`,
          "else:\n",
          "    import subprocess\n",
          `    subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + ${JSON.stringify(setup.requirements)})\n`,
          "\n",
          "print('✅ Packages installed!')"
        ]
      });
    }

    return cells;
  }

  private createAssessmentsCells(assessments: Assessment[]) {
    const cells: Array<{ cell_type: 'markdown' | 'code'; metadata: {}; source: string[] }> = [];
    cells.push({
      cell_type: 'markdown' as const,
      metadata: {},
      source: [
        '## Knowledge Check (Interactive)\n\n',
        'Use the widgets below to select an answer and click Grade to see feedback.\n'
      ]
    });
    cells.push({
      cell_type: 'code' as const,
      metadata: {},
      source: [
        '# MCQ helper (ipywidgets)\n',
        'import ipywidgets as widgets\n',
        'from IPython.display import display, Markdown\n\n',
        'def render_mcq(question, options, correct_index, explanation):\n',
        "    # Use (label, value) so rb.value is the numeric index\n",
        "    rb = widgets.RadioButtons(options=[(f'{chr(65+i)}. '+opt, i) for i,opt in enumerate(options)], description='')\n",
        "    grade_btn = widgets.Button(description='Grade', button_style='primary')\n",
        "    feedback = widgets.HTML(value='')\n",
        '    def on_grade(_):\n',
        '        sel = rb.value\n',
        "        if sel is None:\n            feedback.value = '<p>⚠️ Please select an option.</p>'\n            return\n",
        '        if sel == correct_index:\n',
        "            feedback.value = '<p>✅ Correct!</p>'\n",
        '        else:\n',
        "            feedback.value = f'<p>❌ Incorrect. Correct answer is {chr(65+correct_index)}.</p>'\n",
        "        feedback.value += f'<div><em>Explanation:</em> {explanation}</div>'\n",
        '    grade_btn.on_click(on_grade)\n',
        "    display(Markdown('### '+question))\n",
        '    display(rb)\n',
        '    display(grade_btn)\n',
        '    display(feedback)\n'
      ],
      execution_count: null as any,
      outputs: [] as any[]
    } as any);
    assessments.forEach((mcq, i) => {
      // Validate MCQ structure
      if (!mcq.question || !Array.isArray(mcq.options) || typeof mcq.correct_index !== 'number' || !mcq.explanation) {
        console.warn(`Skipping invalid MCQ at index ${i}:`, mcq);
        return;
      }
      if (mcq.correct_index < 0 || mcq.correct_index >= mcq.options.length) {
        console.warn(`Skipping MCQ with out-of-range correct_index at ${i}`);
        return;
      }
      
      try {
        const call = `render_mcq(${JSON.stringify(mcq.question)}, ${JSON.stringify(mcq.options)}, ${mcq.correct_index}, ${JSON.stringify(mcq.explanation)})\n`;
        cells.push({ cell_type: 'code' as const, metadata: {}, source: [call], execution_count: null as any, outputs: [] as any[] } as any);
      } catch (error) {
        console.warn(`Failed to serialize MCQ at index ${i}:`, error);
      }
    });
    return cells;
  }

  private createTroubleshootingCell() {
    return {
      cell_type: "markdown" as const,
      metadata: {},
      source: [
        "## 🔧 Troubleshooting Guide\n\n",
        "### Common Issues:\n\n",
        "1. **Out of Memory Error**\n",
        "   - Enable GPU: Runtime → Change runtime type → GPU\n",
        "   - Restart runtime if needed\n\n",
        "2. **Package Installation Issues**\n",
        "   - Restart runtime after installing packages\n",
        "   - Use `!pip install -q` for quiet installation\n\n",
        "3. **Model Loading Fails**\n",
        "   - Check internet connection\n",
        "   - Verify authentication tokens\n",
        "   - Try CPU-only mode if GPU fails\n"
      ]
    };
  }

  private formatCellSource(source: string | string[]): string[] {
    if (Array.isArray(source)) return source.map(s => (s.endsWith('\n') ? s : s + '\n'));
    return String(source || '').split('\n').map(line => line + '\n');
  }
}
