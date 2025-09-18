import { OutlineGenerator } from '../packages/alain-kit/core/outline-generator.js';

const provider = (process.env.ALAIN_PROVIDER || 'poe').toLowerCase();
const baseUrl =
  provider === 'lmstudio'
    ? process.env.LM_STUDIO_BASE_URL || 'http://localhost:1234/v1'
    : process.env.OPENAI_BASE_URL || 'https://api.poe.com';
const modelReference =
  process.env.ALAIN_MODEL_REFERENCE || (provider === 'lmstudio' ? (process.env.LM_STUDIO_MODEL || 'gpt-oss-20b') : 'gpt-oss-20b-T');
const apiKey = provider === 'lmstudio' ? process.env.LM_STUDIO_API_KEY || 'local' : process.env.POE_API_KEY;

if (!apiKey) {
  console.error('Missing API key for provider.');
  process.exit(1);
}

async function main() {
  const generator = new OutlineGenerator({ baseUrl });
  process.env.ALAIN_SCENARIO_SLUG = 'smoke-outline';
  process.env.ALAIN_HUMAN_REVIEW_DIR = './tmp-smoke';

  const outline = await generator.generateOutline({
    model: modelReference,
    apiKey,
    difficulty: 'beginner',
    customPrompt: {
      title: 'Quick Smoke Outline',
      description: 'Validate outline JSON compliance',
      difficulty: 'beginner',
    },
  } as any);

  console.log('Outline title:', outline.title);
  console.log('Steps:', outline.outline.length);
}

main().catch(err => {
  console.error('Outline smoke test failed:', err);
  process.exit(1);
});
