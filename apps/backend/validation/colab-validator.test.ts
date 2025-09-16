import { describe, expect, it } from 'vitest';
import { ColabValidator, type ColabIssue } from '../../alain-kit/validation/colab-validator';

const NOTEBOOK_WITH_SUBPROCESS = {
  cells: [
    {
      cell_type: 'code',
      metadata: {},
      source: [
        "import subprocess, sys\n",
        "cmd = [sys.executable, '-m', 'pip', 'install', 'transformers', 'torch']\n",
        "subprocess.check_call(cmd)\n",
      ],
    },
  ],
  metadata: {},
};

const NOTEBOOK_WITH_GUARD = {
  cells: [
    {
      cell_type: 'code',
      metadata: {},
      source: [
        "import subprocess, sys\n",
        "cmd = [sys.executable, '-m', 'pip', 'install', 'transformers', 'torch']\n",
        "try:\n",
        "    subprocess.check_call(cmd)\n",
        "except Exception:\n",
        "    if 'google.colab' in sys.modules:\n",
        "        import subprocess as _subprocess\n",
        "        _subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'transformers', 'torch'])\n",
      ],
    },
  ],
  metadata: {},
};

describe('ColabValidator subprocess pip handling', () => {
  const validator = new ColabValidator();

  it('flags unguarded subprocess pip installs', () => {
    const issues = detectIssues(validator, NOTEBOOK_WITH_SUBPROCESS);
    expect(issues.some(issue => issue.type === 'subprocess_pip')).toBe(true);
  });

  it('ignores cells that already guard subprocess pip for Colab', () => {
    const issues = detectIssues(validator, NOTEBOOK_WITH_GUARD);
    expect(issues.length).toBe(0);
  });
});

function detectIssues(validator: ColabValidator, notebook: any): ColabIssue[] {
  const detector = validator as unknown as { detectIssues(nb: any): ColabIssue[] };
  return detector.detectIssues(notebook);
}
