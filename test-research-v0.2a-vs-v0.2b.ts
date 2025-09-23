#!/usr/bin/env bun

/**
 * Compare ALAIN-Kit research prompts: v0.2a (Research Bundle v2) vs v0.2b (Simplified).
 * Runs each prompt against a set of model references using Poe's gpt-oss-20b API.
 *
 * Usage:
 *   bun test-research-v0.2a-vs-v0.2b.ts
 *   (Requires POE_API_KEY in environment or in project root .env)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

type PromptVersion = 'v0.2a' | 'v0.2b';

interface PromptMessages {
  system: string;
  user: string;
  expectedFormat: 'json' | 'freeform';
}

interface RunResult {
  version: PromptVersion;
  modelRef: string;
  responseText: string;
  jsonParsed: boolean;
  responseTimeMs: number;
  requestPayload: any;
  error?: string;
}

const MODEL_REFERENCES = [
  'openai/gpt-oss-20b',
  'mistralai/Magistral-Small-2509',
  'google/gemma-3-270m-it',
] as const;

const OUTPUT_DIR = 'test-output/v0.2a-vs-v0.2b-research';

function loadDotEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => {
        const eqIndex = line.indexOf('=');
        if (eqIndex === -1) return;
        const key = line.slice(0, eqIndex).trim();
        const value = line.slice(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
  } catch (error) {
    // Ignore missing .env
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function loadPromptMessages(version: PromptVersion, modelRef: string): PromptMessages {
  if (version === 'v0.2b') {
    const promptPath = join(
      process.cwd(),
      'packages/alain-kit/resources/prompts/alain-kit-v0.2b/core/01-research.txt',
    );
    const content = readFileSync(promptPath, 'utf8');
    const systemMarker = 'SYSTEM:';
    const userMarker = '\n\nUSER:';

    const systemStart = content.indexOf(systemMarker);
    const userStart = content.indexOf(userMarker);

    if (systemStart === -1 || userStart === -1) {
      throw new Error('Unexpected format in v0.2b research prompt');
    }

    const system = content
      .slice(systemStart + systemMarker.length, userStart)
      .trim();

    const userTemplate = content.slice(userStart + userMarker.length).trim();

    const user = userTemplate.replace('{{MODEL_REFERENCE_OR_TEXT}}', modelRef);

    return {
      system,
      user,
      expectedFormat: 'json',
    };
  }

  // v0.2a
  const promptPath = join(
    process.cwd(),
    'packages/alain-kit/resources/prompts/alain-kit-v0.2a/core/01-research.offline-bundle.v2.txt',
  );
  const system = readFileSync(promptPath, 'utf8');
  const slug = slugify(modelRef);
  const outDir = join('./out', `research-${slug}`);

  const user = [
    `MODEL_REFERENCE_OR_TEXT: ${modelRef}`,
    `OUT_DIR: ${outDir}`,
    `SAFE_SLUG: ${slug}`,
  ].join('\n');

  return {
    system,
    user,
    expectedFormat: 'freeform',
  };
}

async function callPoe(messages: { system: string; user: string }) {
  const poeApiKey = process.env.POE_API_KEY;
  if (!poeApiKey) {
    throw new Error('POE_API_KEY not set. Add it to your environment or .env file.');
  }

  const payload = {
    model: 'gpt-oss-20b',
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user },
    ],
    temperature: 0.2,
    max_tokens: 3000,
    stream: false,
  };

  const response = await fetch('https://api.poe.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${poeApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return { response, payload };
}

async function runSingleTest(version: PromptVersion, modelRef: string): Promise<RunResult> {
  const { system, user, expectedFormat } = loadPromptMessages(version, modelRef);
  const start = Date.now();
  const { response, payload } = await callPoe({ system, user });
  const elapsed = Date.now() - start;

  if (!response.ok) {
    const errorText = await response.text();
    return {
      version,
      modelRef,
      responseText: '',
      jsonParsed: false,
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
    } catch (error) {
      jsonParsed = false;
    }
  }

  return {
    version,
    modelRef,
    responseText: content,
    jsonParsed,
    responseTimeMs: elapsed,
    requestPayload: payload,
  };
}

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runComparison() {
  loadDotEnv();

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const summary: RunResult[] = [];

  for (const modelRef of MODEL_REFERENCES) {
    console.log(`\n=== Testing model: ${modelRef} ===`);

    for (const version of ['v0.2a', 'v0.2b'] as PromptVersion[]) {
      console.log(`  → Running ${version} research prompt...`);
      try {
        const result = await runSingleTest(version, modelRef);
        summary.push(result);

        const slug = slugify(modelRef);
        const outfile = join(
          OUTPUT_DIR,
          `${timestamp}-${slug}-${version}-response.json`,
        );

        writeFileSync(
          outfile,
          JSON.stringify(
            {
              version,
              model_reference: modelRef,
              response_time_ms: result.responseTimeMs,
              json_parsed: result.jsonParsed,
              error: result.error ?? null,
              response_text: result.responseText,
            },
            null,
            2,
          ),
        );

        if (result.error) {
          console.warn(`    ⚠️  ${result.error}`);
        } else {
          const status = result.jsonParsed ? 'JSON ✅' : 'JSON ❌';
          console.log(
            `    Completed in ${result.responseTimeMs}ms (${status}); saved ${outfile}`,
          );
        }
      } catch (error: any) {
        console.error(`    ❌ Failed to run ${version} for ${modelRef}:`, error?.message ?? error);
      }

      await delay(3500); // Avoid rate limits
    }
  }

  const summaryPath = join(OUTPUT_DIR, `${timestamp}-summary.json`);
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`\nSummary saved to ${summaryPath}`);
}

if (import.meta.main) {
  runComparison().catch((error) => {
    console.error('Test run failed:', error);
    process.exit(1);
  });
}
