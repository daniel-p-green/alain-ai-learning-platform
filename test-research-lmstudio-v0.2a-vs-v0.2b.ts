#!/usr/bin/env bun

/**
 * Compare research prompts (v0.1, v0.2a, v0.2b, v0.2d, v0.2c) against a local LM Studio server.
 * Default base URL: http://localhost:1234/v1 (OpenAI-compatible).
 *
 * Env vars (optional):
 * - LLM_BASE_URL (default: http://localhost:1234/v1)
 * - LLM_MODEL (default: gpt-oss-20b)
 * - LLM_API_KEY (default: none)
 * - LLM_JSON_OBJECT=true  (force json_object for JSON prompts)
 * - LLM_JSON_SCHEMA=true  (use json_schema from prompt guidance when supported)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

type PromptVersion = 'v0.1' | 'v0.2a' | 'v0.2b' | 'v0.2d' | 'v0.2c';

type ExpectedFormat = 'json' | 'freeform';

interface PromptMessages {
  system: string;
  user: string;
  expectedFormat: ExpectedFormat;
}

interface RunResult {
  version: PromptVersion;
  modelRef: string;
  responseText: string;
  jsonParsed: boolean;
  coercedJsonParsed: boolean;
  responseTimeMs: number;
  requestPayload: any;
  error?: string;
}

const MODEL_REFERENCES = [
  'openai/gpt-oss-20b',
  'mistralai/Magistral-Small-2509',
  'google/gemma-3-270m-it',
] as const;

const OUTPUT_DIR = 'test-output/lmstudio-research-comparison';

function loadPromptMessages(version: PromptVersion, modelRef: string, specJson?: string): PromptMessages {
  if (version === 'v0.1') {
    const promptPath = join(process.cwd(), 'packages/alain-kit/resources/prompts/alain-kit/flattened/poe/research.online.v2025-09-13.txt');
    const content = readFileSync(promptPath, 'utf8');
    const systemMarker = 'SYSTEM:';
    const userMarker = '\n\nUSER:';
    const systemStart = content.indexOf(systemMarker);
    const userStart = content.indexOf(userMarker);
    if (systemStart === -1 || userStart === -1) {
      throw new Error('Unexpected format in v0.1 research prompt');
    }
    const system = content.slice(systemStart + systemMarker.length, userStart).trim();
    const userTemplate = content.slice(userStart + userMarker.length).trim();
    const user = userTemplate.replace('{{MODEL_REFERENCE_OR_TEXT}}', modelRef);
    return { system, user, expectedFormat: 'json' };
  }

  if (version === 'v0.2b') {
    const promptPath = join(process.cwd(), 'packages/alain-kit/resources/prompts/alain-kit-v0.2b/core/01-research.txt');
    const content = readFileSync(promptPath, 'utf8');
    const systemMarker = 'SYSTEM:';
    const userMarker = '\n\nUSER:';
    const systemStart = content.indexOf(systemMarker);
    const userStart = content.indexOf(userMarker);
    if (systemStart === -1 || userStart === -1) {
      throw new Error('Unexpected format in v0.2b research prompt');
    }
    const system = content.slice(systemStart + systemMarker.length, userStart).trim();
    const userTemplate = content.slice(userStart + userMarker.length).trim();
    const user = userTemplate.replace('{{MODEL_REFERENCE_OR_TEXT}}', modelRef);
    return { system, user, expectedFormat: 'json' };
  }

  if (version === 'v0.2d') {
    const promptPath = join(process.cwd(), 'packages/alain-kit/resources/prompts/alain-kit-v0.2d/core/01-research.spec-json.v2d.txt');
    const system = readFileSync(promptPath, 'utf8');
    return { system, user: modelRef, expectedFormat: 'json' };
  }

  const slug = modelRef.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  const outDir = join('./out', `research-${slug}`);

  if (version === 'v0.2c') {
    const promptPath = join(process.cwd(), 'packages/alain-kit/resources/prompts/alain-kit-v0.2c/core/01-research.offline-bundle.v2c.txt');
    const system = readFileSync(promptPath, 'utf8');
    const specBlock = specJson ?? '{}';
    const userLines = [
      `MODEL_REFERENCE_OR_TEXT: ${modelRef}`,
      `OUT_DIR: ${outDir}`,
      `SAFE_SLUG: ${slug}`,
      `SPEC_JSON: ${specBlock}`,
    ];
    return { system, user: userLines.join('\n'), expectedFormat: 'freeform' };
  }

  // v0.2a fallback (historical)
  const promptPath = join(process.cwd(), 'packages/alain-kit/resources/prompts/alain-kit-v0.2a/core/01-research.offline-bundle.v2.txt');
  const system = readFileSync(promptPath, 'utf8');
  const userLines = [
    `MODEL_REFERENCE_OR_TEXT: ${modelRef}`,
    `OUT_DIR: ${outDir}`,
    `SAFE_SLUG: ${slug}`,
  ];
  return { system, user: userLines.join('\n'), expectedFormat: 'freeform' };
}

function buildResponseFormat(version: PromptVersion) {
  if (version === 'v0.2d') {
    return {
      type: 'json_schema',
      json_schema: {
        name: 'research_spec_v2d',
        schema: {
          type: 'object',
          additionalProperties: false,
          required: [
            'model_name',
            'identity',
            'technical_specs',
            'inference',
            'evals',
            'sources',
            'disputed',
            'notes'
          ],
          properties: {
            model_name: { type: 'string' },
            identity: {
              type: 'object',
              additionalProperties: false,
              required: ['aliases'],
              properties: {
                aliases: { type: 'array', items: { type: 'string' } }
              }
            },
            technical_specs: {
              type: 'object',
              additionalProperties: false,
              required: ['architecture', 'parameters', 'context_window', 'tokenizer', 'license'],
              properties: {
                architecture: { type: 'string' },
                parameters: { type: 'string' },
                context_window: { type: 'string' },
                tokenizer: { type: 'string' },
                license: { type: 'string' },
              },
            },
            inference: {
              type: 'object',
              additionalProperties: false,
              required: ['servers', 'min_hardware', 'quantization'],
              properties: {
                servers: { type: 'array', items: { type: 'string' } },
                min_hardware: { type: 'string' },
                quantization: { type: 'array', items: { type: 'string' } },
              },
            },
            evals: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['benchmark', 'dataset_version', 'metric', 'score', 'harness', 'notes'],
                properties: {
                  benchmark: { type: 'string' },
                  dataset_version: { type: 'string' },
                  metric: { type: 'string' },
                  score: { type: 'string' },
                  harness: { type: 'string' },
                  notes: { type: 'string' },
                },
              },
            },
            sources: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['url', 'source_type', 'title', 'accessed_date'],
                properties: {
                  url: { type: 'string' },
                  source_type: {
                    type: 'string',
                    enum: ['hf', 'github', 'paper', 'blog', 'leaderboard', 'other'],
                  },
                  title: { type: 'string' },
                  accessed_date: { type: 'string' },
                },
              },
            },
            disputed: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['field', 'claims', 'evidence_urls', 'notes'],
                properties: {
                  field: { type: 'string' },
                  claims: { type: 'array', items: { type: 'string' } },
                  evidence_urls: { type: 'array', items: { type: 'string' } },
                  notes: { type: 'string' },
                },
              },
            },
            notes: { type: 'string' },
          },
        },
        strict: true,
      },
    } as any;
  }

  return undefined;
}

async function callLMStudio(baseUrl: string, model: string, messages: { system: string; user: string }, version: PromptVersion) {
  const apiKey = process.env.LLM_API_KEY || '';
  const responseFormat = buildResponseFormat(version);
  const payload: any = {
    model,
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user },
    ],
    temperature: 0.2,
    max_tokens: 3000,
    stream: false,
  };
  if (responseFormat) payload.response_format = responseFormat;

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  return { response, payload };
}

function coerceFirstJsonObject(text: string): { parsed: any | null } {
  const start = text.indexOf('{');
  if (start === -1) return { parsed: null };
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          return { parsed };
        } catch {}
      }
    }
  }
  return { parsed: null };
}

async function runSingleTest(baseUrl: string, model: string, version: PromptVersion, modelRef: string, specJson?: string): Promise<RunResult> {
  const { system, user, expectedFormat } = loadPromptMessages(version, modelRef, specJson);
  const start = Date.now();
  const { response, payload } = await callLMStudio(baseUrl, model, { system, user }, version);
  const elapsed = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    return {
      version,
      modelRef,
      responseText: '',
      jsonParsed: false,
      coercedJsonParsed: false,
      responseTimeMs: elapsed,
      requestPayload: payload,
      error: `HTTP ${response.status}: ${errorText}`,
    };
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';

  let jsonParsed = false;
  if (expectedFormat === 'json') {
    try {
      JSON.parse(content);
      jsonParsed = true;
    } catch {}
  }

  let coercedJsonParsed = false;
  if (!jsonParsed && expectedFormat === 'json') {
    const coerced = coerceFirstJsonObject(content);
    coercedJsonParsed = !!coerced.parsed;
  }

  return {
    version,
    modelRef,
    responseText: content,
    jsonParsed,
    coercedJsonParsed,
    responseTimeMs: elapsed,
    requestPayload: payload,
  };
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runComparison() {
  const baseUrl = process.env.LLM_BASE_URL || 'http://localhost:1234/v1';
  const model = process.env.LLM_MODEL || 'openai/gpt-oss-20b';

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summary: RunResult[] = [];
  const specCache = new Map<string, any>();

  console.log(`Using base URL: ${baseUrl}`);
  console.log(`Using model: ${model}`);
  console.log(`JSON object: ${process.env.LLM_JSON_OBJECT === 'true'}`);
  console.log(`JSON schema: ${process.env.LLM_JSON_SCHEMA === 'true'}`);

  const versions: PromptVersion[] = ['v0.1', 'v0.2a', 'v0.2b', 'v0.2d', 'v0.2c'];

  for (const modelRef of MODEL_REFERENCES) {
    console.log(`\n=== Testing model: ${modelRef} ===`);
    for (const version of versions) {
      console.log(`  → Running ${version} research prompt...`);
      try {
        const specJson = version === 'v0.2c'
          ? (specCache.get(modelRef) ? JSON.stringify(specCache.get(modelRef), null, 2) : undefined)
          : undefined;
        const result = await runSingleTest(baseUrl, model, version, modelRef, specJson);
        summary.push(result);

        const slug = modelRef.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const outfile = join(OUTPUT_DIR, `${timestamp}-${slug}-${version}-response.json`);
        writeFileSync(outfile, JSON.stringify({
          version,
          model_reference: modelRef,
          response_time_ms: result.responseTimeMs,
          json_parsed: result.jsonParsed,
          coerced_json_parsed: result.coercedJsonParsed,
          error: result.error ?? null,
          response_text: result.responseText,
        }, null, 2));

        if (result.error) {
          console.warn(`    ⚠️  ${result.error}`);
        } else {
          const status = result.jsonParsed
            ? 'JSON ✅'
            : (result.coercedJsonParsed ? 'JSON (coerced) ⚠️' : 'JSON ❌');
          console.log(`    Completed in ${result.responseTimeMs}ms (${status}); saved ${outfile}`);

          if (version === 'v0.2d') {
            let parsed: any = null;
            try {
              parsed = JSON.parse(result.responseText);
            } catch {
              const coerced = coerceFirstJsonObject(result.responseText);
              parsed = coerced.parsed;
            }
            if (parsed) {
              specCache.set(modelRef, parsed);
            } else {
              console.warn('    ⚠️ Unable to parse v0.2d JSON; v0.2c will fall back to Unknowns.');
            }
          }
        }
      } catch (error: any) {
        console.error(`    ❌ Failed ${version} for ${modelRef}:`, error?.message ?? error);
      }
      await delay(2000);
    }
  }

  const summaryPath = join(OUTPUT_DIR, `${timestamp}-summary.json`);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nSummary saved to ${summaryPath}`);
}

if (import.meta.main) {
  runComparison().catch((error) => {
    console.error('Run failed:', error);
    process.exit(1);
  });
}
