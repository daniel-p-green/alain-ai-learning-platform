#!/usr/bin/env node
// ESM script (root package.json uses "type": "module")
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

function usage() {
  console.log('Usage: npm run validate:lesson -- <path1.json> [path2.json ...]');
}

function readJson(file) {
  const txt = fs.readFileSync(file, 'utf8');
  return JSON.parse(txt);
}

// Minimal manual validator mirroring backend/execution/spec/lessonSchema.ts
function manualValidate(obj) {
  const errors = [];
  const LIMITS = { maxObjectives: 8, maxSteps: 7, minSteps: 1, maxTitleLen: 200, maxDescLen: 2000, maxContentLen: 4000, maxCodeLen: 3000 };

  if (!obj || typeof obj !== 'object') errors.push('lesson must be an object');
  if (!obj?.title || typeof obj.title !== 'string') errors.push('title is required');
  if (obj?.title && obj.title.length > LIMITS.maxTitleLen) errors.push('title too long');
  if (!obj?.description || typeof obj.description !== 'string') errors.push('description is required');
  if (obj?.description && obj.description.length > LIMITS.maxDescLen) errors.push('description too long');
  if (!Array.isArray(obj?.steps) || obj.steps.length === 0) errors.push('steps array is required');
  if (Array.isArray(obj?.steps) && (obj.steps.length < LIMITS.minSteps || obj.steps.length > LIMITS.maxSteps)) errors.push('invalid number of steps');
  if (obj?.difficulty && !['beginner','intermediate','advanced'].includes(obj.difficulty)) errors.push('difficulty invalid');
  if (Array.isArray(obj?.steps)) {
    obj.steps.forEach((s, i) => {
      if (!s || typeof s !== 'object') errors.push(`steps[${i}] must be object`);
      if (!s?.title || typeof s.title !== 'string') errors.push(`steps[${i}].title required`);
      if (!s?.content || typeof s.content !== 'string') errors.push(`steps[${i}].content required`);
      if (s?.step_order != null) {
        if (typeof s.step_order !== 'number') errors.push(`steps[${i}].step_order must be number`);
        else if (s.step_order < 1) errors.push(`steps[${i}].step_order must be >= 1`);
      }
      if (s?.code_template != null && typeof s.code_template !== 'string') errors.push(`steps[${i}].code_template must be string`);
      if (s?.content && s.content.length > LIMITS.maxContentLen) errors.push(`steps[${i}].content too long`);
      if (s?.code_template && s.code_template.length > LIMITS.maxCodeLen) errors.push(`steps[${i}].code_template too long`);
    });
  }
  if (obj?.learning_objectives) {
    if (!Array.isArray(obj.learning_objectives)) errors.push('learning_objectives must be array');
    else {
      if (obj.learning_objectives.length > LIMITS.maxObjectives) errors.push('too many learning_objectives');
      obj.learning_objectives.forEach((o, idx) => {
        if (typeof o !== 'string' || !o.trim()) errors.push(`learning_objectives[${idx}] must be non-empty string`);
      });
    }
  }
  if (obj?.assessments) {
    if (!Array.isArray(obj.assessments)) errors.push('assessments must be array');
    else obj.assessments.forEach((a, idx) => {
      if (!a || typeof a !== 'object') errors.push(`assessments[${idx}] must be object`);
      if (typeof a?.question !== 'string' || !a.question.trim()) errors.push(`assessments[${idx}].question required`);
      if (!Array.isArray(a?.options) || a.options.length < 2) errors.push(`assessments[${idx}].options must have >=2`);
      if (typeof a?.correct_index !== 'number' || a.correct_index < 0 || a.correct_index >= (a.options?.length || 0)) errors.push(`assessments[${idx}].correct_index invalid`);
      if (a?.explanation != null && typeof a.explanation !== 'string') errors.push(`assessments[${idx}].explanation must be string`);
    });
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('-'));
  if (args.length === 0) {
    usage();
    process.exit(1);
  }

  // Load schema
  const schemaPath = path.resolve(__dirname, '..', 'schemas', 'alain-lesson.schema.json');
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  // Try to use Ajv if installed; else fallback to manual validator
  let Ajv = null;
  try {
    ({ default: Ajv } = await import('ajv'));
  } catch (_) {
    // no-op
  }

  let ajvValidate = null;
  if (Ajv) {
    try {
      const ajv = new Ajv({ allErrors: true, strict: false });
      ajvValidate = ajv.compile(schema);
    } catch (_) {
      ajvValidate = null;
    }
  }

  let failed = 0;
  for (const file of args) {
    try {
      const abs = path.resolve(process.cwd(), file);
      const data = readJson(abs);
      if (ajvValidate) {
        const ok = ajvValidate(data);
        if (!ok) {
          failed++;
          console.error(`✖ ${file}`);
          for (const err of ajvValidate.errors || []) {
            console.error(`  - ${err.instancePath || ''} ${err.message}`);
          }
        } else {
          console.log(`✓ ${file}`);
        }
      } else {
        const errs = manualValidate(data);
        if (errs.length) {
          failed++;
          console.error(`✖ ${file}`);
          for (const e of errs) console.error(`  - ${e}`);
        } else {
          console.log(`✓ ${file}`);
        }
      }
    } catch (e) {
      failed++;
      console.error(`✖ ${file}`);
      console.error(`  - ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (failed) process.exit(1);
}

main();
