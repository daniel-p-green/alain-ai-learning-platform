import { SectionGenerator } from '../packages/alain-kit/core/section-generator.js';

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

const generator = new SectionGenerator({ baseUrl });

const outline = {
  title: 'Smoke Outline',
  outline: [
    {
      step: 1,
      title: 'Step 1: Smoke Test Section',
      type: 'concept',
      estimated_tokens: 900,
      content_type: 'markdown + code'
    }
  ]
} as any;

async function main() {
  process.env.ALAIN_SCENARIO_SLUG = 'smoke-section';
  process.env.ALAIN_HUMAN_REVIEW_DIR = './tmp-smoke';

  const section = await generator.generateSection({
    outline,
    sectionNumber: 1,
    previousSections: [],
    modelReference,
    apiKey,
    difficulty: 'beginner'
  });

  console.log('Section title:', section.title);
  console.log('Cells:', section.content.length);
}

main().catch(err => {
  console.error('Section smoke test failed:', err);
  process.exit(1);
});
