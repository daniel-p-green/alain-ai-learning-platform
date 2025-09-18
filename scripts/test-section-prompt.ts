import { SectionGenerator } from '../packages/alain-kit/core/section-generator.js';

async function run() {
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) {
    throw new Error('POE_API_KEY not set');
  }

  const generator = new SectionGenerator({ baseUrl: 'https://api.poe.com' });

  const outline = {
    title: 'Demo Outline',
    outline: [
      {
        step: 1,
        title: 'Step 1: Dual Path Overview',
        type: 'concept',
        estimated_tokens: 1000,
        content_type: 'markdown + code'
      }
    ]
  } as any;

  try {
    const section = await generator.generateSection({
      outline,
      sectionNumber: 1,
      previousSections: [],
      modelReference: 'gpt-oss-20b-T',
      apiKey,
      customPrompt: {
        maxTokens: 1000,
        temperature: 0.2
      }
    });

    console.log('=== Section output (truncated) ===');
    console.log(JSON.stringify(section, null, 2).slice(0, 1200));
  } catch (error) {
    console.error('Section generation failed:', (error as Error).message);
  }
}

run();
