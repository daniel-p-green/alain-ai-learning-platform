import fs from 'fs';
import path from 'path';
import { loadHarmonyPrompt } from '../apps/backend/execution/prompts/loader.js';

const apiKey = process.env.POE_API_KEY;
if (!apiKey) {
  console.error('POE_API_KEY not set');
  process.exit(1);
}

const outline = {
  title: 'Sample Outline',
  outline: [
    {
      step: 1,
      title: 'Step 1: Dual Path Overview',
      type: 'concept',
      estimated_tokens: 1000,
      content_type: 'markdown + code'
    }
  ]
};

const sectionNumber = 1;
const previousSections: any[] = [];
const modelRef = 'gpt-oss-20b-T';
const templatePath = path.resolve('packages/alain-kit/resources/prompts/alain-kit/section-fill/research.section.v1.txt');
const template = fs.readFileSync(templatePath, 'utf8');

const filled = template
  .replace(/{{MIN_TOKENS}}/g, '800')
  .replace(/{{MAX_TOKENS}}/g, '1000')
  .replace(/{{SECTION_NUMBER}}/g, String(sectionNumber))
  .replace(/{{SECTION_TITLE}}/g, 'Step 1: Dual Path Overview')
  .replace(/{{DEFAULT_TOKENS}}/g, '1100')
  .replace(/{{OUTLINE_JSON}}/g, JSON.stringify(outline))
  .replace(/{{PREVIOUS_SECTIONS}}/g, JSON.stringify(previousSections))
  .replace(/{{MODEL_REFERENCE}}/g, modelRef)
  .replace(/{{MODEL_REFERENCE_OR_TEXT}}/g, modelRef);

async function callPoe(messages: any[]) {
  const res = await fetch('https://api.poe.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: modelRef,
      messages,
      temperature: 0.2,
      max_tokens: 1000
    })
  });
  const data = await res.json();
  return data;
}

async function run() {
  console.log('--- Poe (current prompt, system from SectionGenerator) ---');
  const sys = 'You are ALAIN-Teacher generating polished notebook sections for production notebooks. Reply with a single valid JSON object that matches the required schema. Do not output planning text, "Thinking...", code fences, or narration outside the JSON. Replace every field with fully developed instructional content and runnable code; never leave template phrases, placeholders, or ellipses.';
  let data = await callPoe([
    { role: 'system', content: sys },
    { role: 'user', content: filled }
  ]);
  console.log(JSON.stringify(data, null, 2).slice(0, 800));

  console.log('\n--- Harmony prompt ---');
  const harmony = loadHarmonyPrompt('resources/prompts/alain-kit/develop.harmony.txt');
  data = await callPoe([
    { role: 'system', content: harmony.system },
    { role: 'developer', content: harmony.developer },
    { role: 'user', content: filled }
  ]);
  console.log(JSON.stringify(data, null, 2).slice(0, 800));
}

run().catch(err => {
  console.error(err);
});
