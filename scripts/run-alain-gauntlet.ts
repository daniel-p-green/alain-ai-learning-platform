import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Scenario {
  name: string;
  description: string;
  generate: () => Promise<void>;
}

const REQUIRED_ENV = ['POE_API_KEY'];

const ensureEnv = () => {
  for (const key of REQUIRED_ENV) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
};

const runCommand = (
  command: string,
  args: string[],
  opts: { cwd?: string; optional?: boolean } = {},
): Promise<boolean> => {
  return new Promise<boolean>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: opts.cwd ?? path.resolve(__dirname, '..'),
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    child.on('close', code => {
      if (code === 0) {
        resolve(true);
      } else {
        const message = `${command} ${args.join(' ')} exited with code ${code}`;
        if (opts.optional) {
          console.warn(`⚠️  Optional command failed: ${message}`);
          resolve(false);
        } else {
          reject(new Error(message));
        }
      }
    });
  });
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const kitPromise = async () => {
  const mod = await import('../packages/alain-kit/validation/integration.ts');
  return mod.ALAINKit as typeof import('../packages/alain-kit/validation/integration.ts').ALAINKit;
};

const outputRoot = path.resolve(
  __dirname,
  '..',
  'gauntlet-output',
  new Date().toISOString().replace(/[:.]/g, '-'),
);

const saveArtifacts = (
  slug: string,
  notebook: unknown,
  report: string,
  metrics: unknown,
) => {
  const dir = path.join(outputRoot, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${slug}.ipynb`), JSON.stringify(notebook, null, 2));
  fs.writeFileSync(path.join(dir, `${slug}-validation.md`), report, 'utf8');
  fs.writeFileSync(path.join(dir, `${slug}-metrics.json`), JSON.stringify(metrics, null, 2));
  console.log(`📁 Saved artifacts to ${dir}`);
};

const loadNotebook = (ipynbPath: string) => {
  const absolute = path.resolve(__dirname, '..', ipynbPath);
  const content = fs.readFileSync(absolute, 'utf8');
  return JSON.parse(content);
};

const extractHeadings = (ipynb: any): string[] => {
  const headings: string[] = [];
  for (const cell of ipynb.cells || []) {
    if (cell.cell_type !== 'markdown') continue;
    const src = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source ?? '');
    const matches = src.match(/^#{1,3}\s+(.+)$/gm);
    if (matches) headings.push(...matches.map(h => h.replace(/^#{1,3}\s+/, '').trim()));
  }
  return headings.slice(0, 10);
};

const truncate = (value: string, max = 3000) => (value.length <= max ? value : `${value.slice(0, max)}...`);

interface NotebookRunResult {
  slug: string;
  qualityScore: number;
  colabCompatible: boolean;
  outputDir: string;
}

interface NotebookScenario extends Scenario {
  generate: () => Promise<NotebookRunResult>;
}

const scenarios = async (): Promise<NotebookScenario[]> => {
  const ALAINKit = await kitPromise();

  const baseRun = async (
    slug: string,
    prompt: {
      title: string;
      description: string;
      difficulty: 'beginner' | 'intermediate' | 'advanced';
      topics?: string[];
      context?: string;
      systemPrompt?: string;
    },
    options: { maxSections?: number }
  ): Promise<NotebookRunResult> => {
    const kit = new ALAINKit({ baseUrl: process.env.OPENAI_BASE_URL || 'https://api.poe.com' });
    const res = await kit.generateNotebook({
      modelReference: 'gpt-oss-20b',
      apiKey: process.env.POE_API_KEY,
      difficulty: prompt.difficulty,
      maxSections: options.maxSections ?? 6,
      customPrompt: prompt,
    } as any);

    if (!res.success) {
      throw new Error(`Notebook generation failed: ${res.validationReport}`);
    }

    console.log(`Quality: ${res.qualityScore} | Colab: ${res.colabCompatible}`);
    saveArtifacts(slug, res.notebook, res.validationReport, {
      qualityScore: res.qualityScore,
      colabCompatible: res.colabCompatible,
      phaseTimings: res.phaseTimings,
      sections: res.sections?.length ?? 0,
    });

    return {
      slug,
      qualityScore: res.qualityScore,
      colabCompatible: Boolean(res.colabCompatible),
      outputDir: path.join(outputRoot, slug),
    };
  };

  const remixNotebook = loadNotebook('resources/content/notebooks/gpt-5_prompting_guide.ipynb');
  const remixHeadings = extractHeadings(remixNotebook);
  const remixContext = truncate(
    JSON.stringify(
      (remixNotebook.cells || []).filter((cell: any) => cell.cell_type === 'markdown'),
    ),
    4000,
  );

  return [
    {
      name: 'remix-poe-vs-local',
      description: 'Remix GPT-5 guide with dual Poe/local paths',
      generate: () =>
        baseRun(
          'remix-poe-vs-local',
          {
            title: 'GPT-5 Prompting Guide — Poe vs Local Remix',
            description:
              'Create a dual-path learning notebook. Version A uses Poe API only (teacher + demos). Version B uses a local model (LM Studio or Ollama) for both teacher orchestration and hands-on code. Highlight differences, setup steps, and troubleshooting for each path.',
            difficulty: 'beginner',
            topics: remixHeadings,
            context: `Source headings: ${remixHeadings.join(' | ')}\n\nMarkdown excerpt:\n${remixContext}\n\nRequirements:\n- Every major section must include clearly labelled subsections for Version A (Poe API) and Version B (Local LM Studio/Ollama).\n- Provide explicit environment setup cells for both providers (API keys, local server instructions).\n- Include at least four knowledge checks dispersed throughout the notebook covering both versions.\n- Conclude with guidance on choosing between Poe and local models.`,
          },
          { maxSections: 6 }
        ),
    },
    {
      name: 'chatgpt-interface-beginner',
      description: 'Beginner notebook: build chat-style UI with gpt-oss-20b',
      generate: () =>
        baseRun(
          'chatgpt-interface-beginner',
          {
            title: 'Build a ChatGPT-style Interface with gpt-oss-20b',
            description:
              'Teach beginners how to craft a simple chat interface, providing two pathways: Version A (Poe API only) and Version B (local LM Studio/Ollama). Emphasize environment setup, request/response handling, and UX tips.',
            difficulty: 'beginner',
            topics: [
              'Prompt design fundamentals',
              'UI wiring for chat interfaces',
              'Session state management',
              'Error handling & rate limits',
              'Deploying locally vs using Poe',
            ],
            context:
              'Requirements:\n- Provide a full walkthrough for Version A (Poe API) including API client setup, streaming responses, and cost monitoring.\n- Provide a full walkthrough for Version B using LM Studio or Ollama (including model download, server startup, client code).\n- Each step should contain both code snippets and practical advice for the two versions.\n- Add at least four dispersed knowledge checks comparing Poe vs local considerations.\n- Include a final section summarizing trade-offs and next steps.',
          },
          { maxSections: 7 }
        ),
    },
    {
      name: 'rlhf-blind-judging-advanced',
      description: 'Advanced notebook: build LMArena-style blind judging workflow',
      generate: () =>
        baseRun(
          'rlhf-blind-judging-advanced',
          {
            title: 'Build an LMArena-style Blind Judging Workflow with RLHF Ranking',
            description:
              'For advanced practitioners: orchestrate a blind comparison of two LLMs with RLHF-inspired ranking, providing dual setups (Poe API vs Local). Include leaderboard aggregation and fairness considerations.',
            difficulty: 'advanced',
            topics: [
              'Prompt evaluation pipelines',
              'Blind judging UX',
              'Ranking aggregation (e.g., Bradley–Terry, Elo)',
              'Data logging & reproducibility',
              'Ethical considerations in RLHF',
            ],
            context:
              'Requirements:\n- Implement data ingestion, blind evaluation UI, and ranking updates.\n- Version A must rely solely on Poe API (teacher + contestant models).\n- Version B must demonstrate the same workflow using LM Studio/Ollama endpoints.\n- Provide instructions for running multiple matchups, persisting results, and visualizing leaderboards.\n- Include knowledge checks focusing on fairness, bias, and operational scaling.\n- Close with recommendations for deploying a judging service safely.',
          },
          { maxSections: 8 }
        ),
    },
  ];
};

interface NotebookScenarioResult extends NotebookRunResult {
  name: string;
  description: string;
  success: boolean;
  errorMessage?: string;
}

interface CommandResult {
  name: string;
  success: boolean;
  optional: boolean;
}

const runNotebookScenarios = async (): Promise<NotebookScenarioResult[]> => {
  const list = await scenarios();
  const results: NotebookScenarioResult[] = [];
  for (const scenario of list) {
    console.log(`\n=== ${scenario.name} ===\n${scenario.description}`);
    try {
      const outcome = await scenario.generate();
      results.push({
        name: scenario.name,
        description: scenario.description,
        success: true,
        ...outcome,
      });
    } catch (error) {
      console.error(`❌ Notebook scenario failed: ${scenario.name}`, error);
      results.push({
        name: scenario.name,
        description: scenario.description,
        success: false,
        slug: slugify(scenario.name),
        qualityScore: 0,
        colabCompatible: false,
        outputDir: path.join(outputRoot, slugify(scenario.name)),
        errorMessage: (error as Error).message,
      });
    }
  }
  return results;
};

const runTestCommands = async (): Promise<CommandResult[]> => {
  const root = path.resolve(__dirname, '..');
  const commands: Array<{ name: string; command: string; args: string[]; optional?: boolean }> = [
    { name: 'npm run lint', command: 'npm', args: ['run', 'lint'], optional: true },
    { name: 'npm run build', command: 'npm', args: ['run', 'build'], optional: true },
    { name: 'npm run test', command: 'npm', args: ['run', 'test'], optional: true },
    {
      name: 'npm --workspace packages/alain-kit-sdk run test',
      command: 'npm',
      args: ['--workspace', 'packages/alain-kit-sdk', 'run', 'test'],
      optional: true,
    },
  ];

  const results: CommandResult[] = [];
  for (const cmd of commands) {
    const success = await runCommand(cmd.command, cmd.args, { cwd: root, optional: cmd.optional });
    results.push({ name: cmd.name, success, optional: Boolean(cmd.optional) });
  }
  return results;
};

const writeSummary = (notebooks: NotebookScenarioResult[], commands: CommandResult[]) => {
  const lines: string[] = [];
  lines.push('# ALAIN Gauntlet Summary');
  lines.push(`Generated at ${new Date().toISOString()}`);
  lines.push('');

  lines.push('## Notebook Scenarios');
  if (!notebooks.length) {
    lines.push('- _No notebook scenarios executed._');
  } else {
    for (const result of notebooks) {
      const status = result.success ? '✅' : '❌';
      lines.push(
        `- ${status} ${result.name} — quality: ${result.qualityScore}, colab: ${result.colabCompatible ? 'pass' : 'fail'} (${result.outputDir})${
          result.errorMessage ? `\n  - Error: ${result.errorMessage}` : ''
        }`,
      );
    }
  }
  lines.push('');

  lines.push('## Test Commands');
  if (!commands.length) {
    lines.push('- _No commands executed._');
  } else {
    for (const cmd of commands) {
      const status = cmd.success ? '✅' : cmd.optional ? '⚠️' : '❌';
      lines.push(`- ${status} ${cmd.name}`);
    }
  }

  const summaryPath = path.join(outputRoot, 'summary.md');
  fs.writeFileSync(summaryPath, lines.join('\n'), 'utf8');
  console.log('\n==== Gauntlet Summary ====' );
  console.log(lines.join('\n'));
  console.log(`\nSummary written to ${summaryPath}`);
};

const main = async () => {
  ensureEnv();
  fs.mkdirSync(outputRoot, { recursive: true });
  console.log(`📂 ALAIN Gauntlet output directory: ${outputRoot}`);

  try {
    const notebookResults = await runNotebookScenarios();
    const commandResults = await runTestCommands();
    writeSummary(notebookResults, commandResults);
    console.log('\n✅ Gauntlet completed. Review generated notebooks in:', outputRoot);
  } catch (error) {
    console.error('\n❌ Gauntlet failed:', (error as Error).message);
    process.exitCode = 1;
  }
};

main();
