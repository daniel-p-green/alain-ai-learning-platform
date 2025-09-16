import { ALAINKit } from '../index';

async function main() {
  const kit = new ALAINKit();
  const res = await kit.generateNotebook({
    modelReference: process.env.MODEL_REF || 'gpt-oss-20b',
    apiKey: process.env.POE_API_KEY || 'local',
    difficulty: 'beginner',
    maxSections: 5,
    customPrompt: {
      title: 'Intro to GPT‑OSS',
      description: 'Beginner guide to using GPT‑OSS safely and effectively',
      difficulty: 'beginner',
      topics: ['setup', 'first call', 'parameters', 'troubleshooting']
    }
  });

  console.log('\nQuality:', res.qualityScore);
  console.log('Colab Compatible:', res.colabCompatible ? '✅' : '⚠️');
  console.log('Cells:', res.notebook?.cells?.length ?? 0);
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
