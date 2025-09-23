#!/usr/bin/env bun

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE_URL = (process.env.LLM_BASE_URL || 'http://localhost:1234/v1').replace(/\/$/, '');
const MODEL = process.env.LLM_MODEL || 'openai/gpt-oss-20b';
const OUT_DIR = 'test-output/lmstudio-v0.3';
const MODELS = ['openai/gpt-oss-20b','mistralai/Magistral-Small-2509','google/gemma-3-270m-it'];

function prompt(path: string) { return readFileSync(path, 'utf8'); }

async function call(payload: any) {
  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

function schemaForSpec() {
  // mirror v0.3 spec
  return {
    type: 'json_schema',
    json_schema: {
      name: 'research_spec_v0_3',
      schema: {
        type: 'object', additionalProperties: false,
        required: ['model_name','identity','technical_specs','inference','evals','sources','disputed','notes'],
        properties: {
          model_name: { type: 'string' },
          identity: { type: 'object', additionalProperties: false, required: ['aliases'], properties: { aliases: { type: 'array', items: { type: 'string' } } } },
          technical_specs: { type: 'object', additionalProperties: false, required: ['architecture','parameters','context_window','tokenizer','license'], properties: { architecture:{type:'string'}, parameters:{type:'string'}, context_window:{type:'string'}, tokenizer:{type:'string'}, license:{type:'string'} } },
          inference: { type: 'object', additionalProperties: false, required: ['servers','min_hardware','quantization'], properties: { servers:{type:'array',items:{type:'string'}}, min_hardware:{type:'string'}, quantization:{type:'array',items:{type:'string'}} } },
          evals: { type: 'array', items: { type:'object', additionalProperties:false, required:['benchmark','dataset_version','metric','score','harness','notes'], properties: { benchmark:{type:'string'}, dataset_version:{type:'string'}, metric:{type:'string'}, score:{type:'string'}, harness:{type:'string'}, notes:{type:'string'} } } },
          sources: { type: 'array', items: { type:'object', additionalProperties:false, required:['url','source_type','title','accessed_date'], properties: { url:{type:'string'}, source_type:{type:'string', enum:['hf','github','paper','blog','leaderboard','other']}, title:{type:'string'}, accessed_date:{type:'string'} } } },
          disputed: { type: 'array', items: { type:'object', additionalProperties:false, required:['field','claims','evidence_urls','notes'], properties: { field:{type:'string'}, claims:{type:'array',items:{type:'string'}}, evidence_urls:{type:'array',items:{type:'string'}}, notes:{type:'string'} } } },
          notes: { type: 'string' }
        }
      },
      strict: true
    }
  };
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const specSys = prompt('packages/alain-kit/resources/prompts/alain-kit-v0.3/core/01-spec.strict.json.v0.3.txt');
  const bundleSys = prompt('packages/alain-kit/resources/prompts/alain-kit-v0.3/core/02-bundle.offline.v0.3.txt');

  for (const m of MODELS) {
    const t = Date.now();
    // Stage 1: spec
    const specPayload:any = {
      model: MODEL,
      messages: [ { role:'system', content: specSys }, { role:'user', content: m } ],
      response_format: schemaForSpec(), temperature: 0.25, max_tokens: 1000
    };
    const specRes = await call(specPayload);
    const specPath = join(OUT_DIR, `${t}-${m.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-spec.json`);
    writeFileSync(specPath, specRes.text);
    let specJson: any = null;
    try { specJson = JSON.parse(JSON.parse(specRes.text).choices?.[0]?.message?.content ?? '{}'); } catch {}

    // Stage 2: bundle
    const slug = m.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const user = [
      `MODEL_REFERENCE_OR_TEXT: ${m}`,
      `OUT_DIR: out/research-${slug}`,
      `SAFE_SLUG: ${slug}`,
      `SPEC_JSON: ${specJson ? JSON.stringify(specJson) : '{}'}`,
    ].join('\n');
    const bundlePayload:any = {
      model: MODEL,
      messages: [ { role:'system', content: bundleSys }, { role:'user', content: user } ],
      temperature: 0.25, max_tokens: 3000
    };
    const bundleRes = await call(bundlePayload);
    const bundlePath = join(OUT_DIR, `${t}-${slug}-bundle.txt`);
    writeFileSync(bundlePath, bundleRes.text);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
