import { describe, expect, it } from 'vitest';
import { ColabValidator, type ColabIssue } from '../../../packages/alain-kit/validation/colab-validator';

const NOTEBOOK_WITH_SUBPROCESS = {
  cells: [
    {
      cell_type: 'code',
      metadata: {},
      source: [
        "import subprocess, sys\n",
        "subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'transformers', 'torch'])\n",
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
        "IN_COLAB = 'google.colab' in sys.modules\n",
        "cmd = [sys.executable, '-m', 'pip', 'install', 'transformers', 'torch']\n",
        "if IN_COLAB:\n",
        "    import subprocess as _subprocess\n",
        "    _subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + cmd[4:])\n",
        "else:\n",
        "    subprocess.check_call(cmd)\n",
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
