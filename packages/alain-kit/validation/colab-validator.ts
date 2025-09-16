import { supportsTemperature } from '../core/model-caps';

/**
 * ALAIN-Kit Colab Validator
 * 
 * Detects and fixes Google Colab compatibility issues automatically.
 * Prevents common errors before notebooks reach users.
 */

export interface ColabIssue {
  type: string;
  severity: 'critical' | 'warning';
  description: string;
  cellIndex: number;
  autoFixable: boolean;
}

export interface ColabValidationResult {
  isCompatible: boolean;
  issues: ColabIssue[];
  fixedNotebook?: any;
}

type ModelReviewConfig = {
  model: string;
  baseUrl: string;
  apiKey: string;
};

export class ColabValidator {
  private readonly ERROR_PATTERNS = [
    {
      pattern: /subprocess\.check_call.*pip.*install/,
      type: 'subprocess_pip',
      severity: 'critical' as const,
      description: 'subprocess pip install fails in Colab',
      fix: (source: string) => {
        const pipCall = /(^\s*)subprocess\.check_call\(\[sys\.executable,\s*["']-m["'],\s*["']pip["'],\s*["']install["'](.*?)\]\)/gms;
        return source.replace(pipCall, (_match, indent: string, tail: string) => {
          const argsTail = tail || '';
          const cmdList = `[sys.executable, "-m", "pip", "install"${argsTail}]`;
          const indent1 = `${indent}    `;
          const indent2 = `${indent1}    `;
          const indent3 = `${indent2}    `;
          return [
            `${indent}cmd = ${cmdList}`,
            `${indent}try:`,
            `${indent1}subprocess.check_call(cmd)`,
            `${indent}except Exception as exc:`,
            `${indent1}if IN_COLAB:`,
            `${indent2}packages = [arg for arg in cmd[4:] if isinstance(arg, str)]`,
            `${indent2}if packages:`,
            `${indent3}try:`,
            `${indent3}    import IPython`,
            `${indent3}    ip = IPython.get_ipython()`,
            `${indent3}    if ip is not None:`,
            `${indent3}        ip.run_line_magic('pip', 'install ' + ' '.join(packages))`,
            `${indent3}    else:`,
            `${indent3}        import subprocess as _subprocess`,
            `${indent3}        _subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + packages)`,
            `${indent3}except Exception as colab_exc:`,
            `${indent3}    print('⚠️ Colab pip fallback failed:', colab_exc)`,
            `${indent3}    raise`,
            `${indent2}else:`,
            `${indent3}print('No packages specified for pip install; skipping fallback')`,
            `${indent1}else:`,
            `${indent2}raise`
          ].join('\n');
        });
      }
    },
    {
      pattern: /os\.environ\["HF_TOKEN"\]\s*=\s*"YOUR_HF_TOKEN"/,
      type: 'hardcoded_token',
      severity: 'critical' as const,
      description: 'Hardcoded token placeholder causes auth errors',
      fix: (source: string) => source.replace(
        /os\.environ\["HF_TOKEN"\]\s*=\s*"YOUR_HF_TOKEN"/g,
        `if IN_COLAB:
    from getpass import getpass
    os.environ["HF_TOKEN"] = getpass('Enter HF token: ')
else:
    os.environ["HF_TOKEN"] = "YOUR_HF_TOKEN"`
      )
    },
    {
      pattern: /device_map="auto"/,
      type: 'device_mapping',
      severity: 'warning' as const,
      description: 'device_map="auto" may not work optimally in Colab',
      fix: (source: string) => source.replace(
        /device_map="auto"/g,
        'device_map="cuda:0" if torch.cuda.is_available() else "cpu"'
      )
    }
  ];

  private readonly reviewConfig: ModelReviewConfig | null;

  constructor() {
    const model = process.env.ALAIN_COLAB_MODEL;
    const apiKey = process.env.POE_API_KEY || process.env.OPENAI_API_KEY || '';
    const base = (process.env.ALAIN_COLAB_BASE || process.env.OPENAI_BASE_URL || 'https://api.poe.com/v1').replace(/\/$/, '');
    this.reviewConfig = model && apiKey ? { model, apiKey, baseUrl: base } : null;
  }

  /**
   * Validate notebook for Colab compatibility
   */
  async validateNotebook(notebookPath: string): Promise<ColabValidationResult> {
    const notebook = require('fs').readFileSync(notebookPath, 'utf8');
    const notebookData = JSON.parse(notebook);
    
    const issues = this.detectIssues(notebookData);
    const tolerance = Number(process.env.ALAIN_COLAB_MAX_ISSUES || '0');
    const criticalCount = issues.filter(issue => issue.severity === 'critical').length;

    if (criticalCount <= tolerance) {
      return {
        isCompatible: true,
        issues,
        fixedNotebook: null
      };
    }

    const fixedNotebook = await this.applyFixes(notebookData, issues);
    const postIssues = this.detectIssues(fixedNotebook);
    const postCritical = postIssues.filter(issue => issue.severity === 'critical').length;
    const compatibleAfterFix = postCritical <= tolerance;
    return {
      isCompatible: compatibleAfterFix,
      issues: compatibleAfterFix ? [] : postIssues,
      fixedNotebook
    };
  }

  private detectIssues(notebook: any): ColabIssue[] {
    const issues: ColabIssue[] = [];
    
    notebook.cells.forEach((cell: any, index: number) => {
      if (cell.cell_type === 'code') {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
        
        this.ERROR_PATTERNS.forEach(pattern => {
          if (!pattern.pattern.test(source)) { return; }
          if (pattern.type === 'subprocess_pip') {
            const normalized = source.replace(/\r?\n/g, '\n');
            const hasGuard = /if\s+IN_COLAB/.test(normalized) && (
              normalized.includes("run_line_magic('pip'") ||
              normalized.includes('run_line_magic("pip"') ||
              normalized.includes('_subprocess.check_call(')
            );
            if (hasGuard) { return; }
          }
          issues.push({
            type: pattern.type,
            severity: pattern.severity,
            description: pattern.description,
            cellIndex: index,
            autoFixable: true
          });
        });
      }
    });
    
    return issues;
  }

  private async applyFixes(notebook: any, issues: ColabIssue[]): Promise<any> {
    const fixedNotebook = JSON.parse(JSON.stringify(notebook));
    
    // Add environment detection cell at beginning
    const envCell = {
      cell_type: "code",
      metadata: {},
      source: [
        "# Environment Detection\n",
        "import sys\n",
        "IN_COLAB = 'google.colab' in sys.modules\n",
        "print(f'Environment: {\"Colab\" if IN_COLAB else \"Local\"}')\n"
      ]
    };
    fixedNotebook.cells.unshift(envCell);
    
    // Apply fixes to problematic cells
    for (const issue of issues) {
      if (issue.autoFixable && issue.cellIndex !== undefined) {
        const cell = fixedNotebook.cells[issue.cellIndex + 1]; // +1 due to inserted env cell
        if (cell && cell.cell_type === 'code') {
          let source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
          const pattern = this.ERROR_PATTERNS.find(p => p.type === issue.type);
          if (pattern?.fix) {
            source = pattern.fix(source);
          }
          if (this.reviewConfig) {
            const reviewed = await this.requestModelReview(source, issue.type);
            if (reviewed) {
              source = reviewed;
            }
          }
          cell.source = this.toNotebookSource(source);
        }
      }
    }
    
    return fixedNotebook;
  }

  private toNotebookSource(text: string): string[] {
    const normalized = text.replace(/\r?\n/g, '\n');
    const lines = normalized.split('\n');
    return lines.map((line, idx) => idx === lines.length - 1 ? line : line + '\n');
  }

  private async requestModelReview(source: string, issueType: string): Promise<string | null> {
    if (!this.reviewConfig) return null;
    const { model, baseUrl, apiKey } = this.reviewConfig;
    try {
      const body: any = {
        model,
        messages: [
          {
            role: 'system',
            content: 'You rewrite Python notebook cells so they run cleanly in Google Colab. Respond ONLY with JSON: {"fixed": "<rewritten code>"}. Preserve code fences where present. Do not add explanations.'
          },
          {
            role: 'user',
            content: `Issue type: ${issueType}\n---\n${source}`
          }
        ],
        response_format: { type: 'json_object' as const }
      };
      if (supportsTemperature(model)) {
        body.temperature = 0.1;
      }
      const endpoint = baseUrl.endsWith('/v1') ? baseUrl : `${baseUrl}/v1`;
      const resp = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!resp.ok) return null;
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) return null;
      try {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed.fixed === 'string') {
          return parsed.fixed.trimEnd();
        }
      } catch {}
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Generate compatibility report
   */
  generateReport(result: ColabValidationResult): string {
    const status = result.isCompatible ? '✅ Compatible' : '❌ Issues Found';
    const criticalCount = result.issues.filter(i => i.severity === 'critical').length;
    
    return `# Colab Compatibility Report

**Status: ${status}**
**Critical Issues: ${criticalCount}**
**Total Issues: ${result.issues.length}**

${result.issues.map((issue, i) => 
  `${i + 1}. ${issue.type} (${issue.severity})\n   ${issue.description}`
).join('\n\n')}

${result.isCompatible ? 
  'Ready for Colab deployment!' : 
  'Auto-fixes applied. Please test in Colab.'}`;
  }
}
