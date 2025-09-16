#!/usr/bin/env tsx
/**
 * Demo script to show notebook generation with ALAIN attribution
 * Run with: npx tsx scripts/demo-notebook-generation.ts
 */

import { buildNotebook } from '../export/notebook';
import { saveNotebookWithMetadata } from '../utils/notebook-paths';

// Sample lesson data
const meta = {
  title: 'GPT-OSS-20B Quick Start Guide',
  description: 'Learn how to use GPT-OSS-20B for text generation tasks',
  provider: 'openai-compatible',
  model: 'gpt-oss-20b'
};

const steps = [
  {
    step_order: 1,
    title: 'Basic Text Generation',
    content: 'Generate a simple response using GPT-OSS-20B',
    code_template: 'Write a haiku about artificial intelligence'
  },
  {
    step_order: 2,
    title: 'Structured Output',
    content: 'Generate structured JSON output',
    code_template: 'Create a JSON object with fields: name, version, description for GPT-OSS-20B'
  }
];

const assessments = [
  {
    step_order: 1,
    question: 'What is the typical structure of a haiku?',
    options: ['3 lines with 5-7-5 syllables', '4 lines with rhyme', '2 lines with metaphor'],
    correct_index: 0,
    explanation: 'A haiku traditionally has 3 lines with 5-7-5 syllable pattern'
  }
];

const maker = {
  name: 'OpenAI',
  org_type: 'company',
  homepage: 'https://openai.com',
  license: 'Custom',
  repo: 'https://huggingface.co/openai/gpt-oss-20b'
};

// Generate the notebook
console.log('🔧 Generating notebook with ALAIN attribution...');
const notebook = buildNotebook(meta, steps, assessments, maker);

// Save to organized directory structure
const savedPath = saveNotebookWithMetadata(
  notebook,
  {
    model: meta.model,
    title: meta.title,
    difficulty: 'beginner',
    tags: ['tutorial', 'quickstart', 'text-generation']
  },
  maker
);

console.log(`✅ Notebook saved to: ${savedPath}`);
console.log(`📊 Generated ${notebook.cells.length} cells`);
console.log(`📝 Attribution comment: ${notebook.cells[0].source[1].trim()}`);

// Show first few cells structure
console.log('\n📋 Notebook structure:');
notebook.cells.slice(0, 6).forEach((cell, i) => {
  const preview = cell.source.join('').substring(0, 50).replace(/\n/g, ' ');
  console.log(`  ${i}: ${cell.cell_type} - ${preview}...`);
});
