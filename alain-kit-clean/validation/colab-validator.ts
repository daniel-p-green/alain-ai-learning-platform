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

export class ColabValidator {
  private readonly ERROR_PATTERNS = [
    {
      pattern: /subprocess\.check_call.*pip.*install/,
      type: 'subprocess_pip',
      severity: 'critical' as const,
      description: 'subprocess pip install fails in Colab',
      fix: (source: string) => source.replace(
        /subprocess\.check_call\(\[sys\.executable, "-m", "pip", "install".*?\]\)/gs,
        'if IN_COLAB:\n    !pip install -q transformers torch\nelse:\n    subprocess.check_call([sys.executable, "-m", "pip", "install", "transformers", "torch"])'
      )
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

  /**
   * Validate notebook for Colab compatibility
   */
  validateNotebook(notebookPath: string): ColabValidationResult {
    const notebook = require('fs').readFileSync(notebookPath, 'utf8');
    const notebookData = JSON.parse(notebook);
    
    const issues = this.detectIssues(notebookData);
    const isCompatible = !issues.some(issue => issue.severity === 'critical');
    
    return {
      isCompatible,
      issues,
      fixedNotebook: isCompatible ? null : this.applyFixes(notebookData, issues)
    };
  }

  private detectIssues(notebook: any): ColabIssue[] {
    const issues: ColabIssue[] = [];
    
    notebook.cells.forEach((cell: any, index: number) => {
      if (cell.cell_type === 'code') {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
        
        this.ERROR_PATTERNS.forEach(pattern => {
          if (pattern.pattern.test(source)) {
            issues.push({
              type: pattern.type,
              severity: pattern.severity,
              description: pattern.description,
              cellIndex: index,
              autoFixable: true
            });
          }
        });
      }
    });
    
    return issues;
  }

  private applyFixes(notebook: any, issues: ColabIssue[]): any {
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
    issues.forEach(issue => {
      if (issue.autoFixable && issue.cellIndex !== undefined) {
        const cell = fixedNotebook.cells[issue.cellIndex + 1]; // +1 due to inserted env cell
        if (cell && cell.cell_type === 'code') {
          let source = Array.isArray(cell.source) ? cell.source.join('') : cell.source || '';
          
          const pattern = this.ERROR_PATTERNS.find(p => p.type === issue.type);
          if (pattern?.fix) {
            source = pattern.fix(source);
            cell.source = source.split('\n').map(line => line + '\n');
          }
        }
      }
    });
    
    return fixedNotebook;
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
