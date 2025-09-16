import { ALAINKit } from '../index';
import * as fs from 'fs';
import * as path from 'path';

interface TestConfig {
  name: string;
  type: 'local' | 'poe';
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

const TEST_CONFIGS: TestConfig[] = [
  // baseUrl should be provider root (no /v1); SDK appends /v1/chat/completions
  { name: 'Ollama', type: 'local', model: 'gpt-oss-20b', baseUrl: 'http://localhost:11434' },
  { name: 'LM Studio', type: 'local', model: 'gpt-oss-20b', baseUrl: 'http://localhost:1234' },
  { name: 'Poe GPT‑OSS‑20B', type: 'poe', model: 'gpt-oss-20b', apiKey: process.env.POE_API_KEY || '' },
  { name: 'Poe GPT‑OSS‑120B', type: 'poe', model: 'gpt-oss-120b', apiKey: process.env.POE_API_KEY || '' }
];

const PROMPT = {
  title: 'GPT‑OSS Prompting Guide for Absolute Beginners',
  description: 'A beginner‑friendly guide to effective prompting with GPT‑OSS models',
  difficulty: 'beginner',
  topics: ['Basic prompt structure', 'Getting started', 'Pitfalls', 'Best practices', 'Interactive examples']
};

async function runTest(config: TestConfig) {
  console.log(`\n🚀 Testing with ${config.name} (${config.model})`);
  const kit = new ALAINKit({ baseUrl: config.baseUrl });
  const start = Date.now();
  const result = await kit.generateNotebook({
    modelReference: config.model,
    apiKey: config.apiKey || 'local',
    difficulty: 'beginner',
    maxSections: 5,
    customPrompt: {
      ...PROMPT,
      modelSpecificInstructions: config.model.includes('120b') ?
        'Include more complex examples' : 'Keep examples simple and focused'
    }
  });
  const dur = ((Date.now() - start) / 1000).toFixed(1);
  if (!result.success) {
    console.error(`❌ Failed: ${result.validationReport}`);
    return;
  }
  const outDir = path.join(process.cwd(), 'output', config.name.toLowerCase().replace(/\s+/g, '-'));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'prompting-guide.ipynb'), JSON.stringify(result.notebook, null, 2));
  fs.writeFileSync(path.join(outDir, 'validation-report.md'), result.validationReport);
  console.log(`✅ Success! (${dur}s)  Quality=${result.qualityScore}  Colab=${result.colabCompatible ? '✅' : '⚠️'}`);
}

(async () => {
  for (const cfg of TEST_CONFIGS) {
    if (cfg.type === 'poe' && !cfg.apiKey) { console.log(`Skipping ${cfg.name} (no POE_API_KEY)`); continue; }
    await runTest(cfg);
  }
  console.log('\n🎉 Completed');
})();
