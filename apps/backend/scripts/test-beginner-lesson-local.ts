#!/usr/bin/env tsx
/**
 * Generate a beginner lesson for openai/gpt-oss-20b via a local OpenAI-compatible endpoint
 * - Works with LM Studio (http://localhost:1234/v1, model: gpt-oss-20b)
 * - Works with Ollama   (http://localhost:11434/v1, model: gpt-oss:20b)
 *
 * Usage:
 *   BASE_URL=http://localhost:1234/v1 MODEL=gpt-oss-20b tsx backend/scripts/test-beginner-lesson-local.ts
 *   BASE_URL=http://localhost:11434/v1 MODEL=gpt-oss:20b tsx backend/scripts/test-beginner-lesson-local.ts
 *
 * If env vars are not set, the script will try LM Studio first, then Ollama.
 */

import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const HF_URL = 'https://huggingface.co/openai/gpt-oss-20b';

const DEFAULTS = {
  lmStudio: { baseUrl: 'http://localhost:1234/v1', model: 'gpt-oss-20b' },
  ollama:   { baseUrl: 'http://localhost:11434/v1', model: 'gpt-oss:20b' },
};

type Lesson = {
  title: string;
  description: string;
  reasoning_summary?: string;
  learning_objectives?: string[];
  steps: Array<{
    step_order: number;
    title: string;
    content: string;
    code_template?: string;
    expected_output?: string;
    model_params?: any;
  }>;
};

const FUNCTION_EMIT_LESSON = {
  name: 'emit_lesson',
  description: 'Return a structured lesson object',
  parameters: {
    type: 'object',
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      reasoning_summary: { type: 'string' },
      learning_objectives: { type: 'array', items: { type: 'string' } },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            step_order: { type: 'integer' },
            title: { type: 'string' },
            content: { type: 'string' },
            code_template: { type: 'string' },
            expected_output: { type: 'string' },
            model_params: { type: 'object' },
          },
          required: ['step_order','title','content']
        }
      },
    },
    required: ['title','description','steps']
  }
};

function now() { return new Date().toISOString(); }

function pickEndpointAndModel(): { baseUrl: string; model: string } {
  const envBase = (process.env.BASE_URL || '').trim();
  const envModel = (process.env.MODEL || '').trim();
  if (envBase && envModel) return { baseUrl: envBase, model: envModel };
  // Autodetect based on known defaults; prefer LM Studio first
  if (!envBase && !envModel) {
    return { baseUrl: DEFAULTS.lmStudio.baseUrl, model: DEFAULTS.lmStudio.model };
  }
  if (envBase && !envModel) {
    return {
      baseUrl: envBase,
      model: /11434/.test(envBase) ? DEFAULTS.ollama.model : DEFAULTS.lmStudio.model,
    };
  }
  if (!envBase && envModel) {
    return {
      baseUrl: envModel.includes(':') ? DEFAULTS.ollama.baseUrl : DEFAULTS.lmStudio.baseUrl,
      model: envModel,
    };
  }
  // Fallback
  return { baseUrl: DEFAULTS.lmStudio.baseUrl, model: DEFAULTS.lmStudio.model };
}

function buildBeginnerLessonPrompt(): string {
  return [
    `Create a beginner-friendly lesson about the model at ${HF_URL}.`,
    '',
    'Requirements:',
    '- Audience: Complete beginners with basic Python',
    '- Explain what GPT-OSS-20B is, typical use cases, and limitations',
    '- Show how to run a simple chat completion via an OpenAI-compatible API',
    '- Provide 4–6 clear steps with concise code blocks',
    '- Favor runnable examples; avoid long prose',
    '',
    'Return the lesson strictly via the emit_lesson function. If tools are unavailable, output a single strict JSON object (no markdown fences, no extra prose) with fields: title, description, learning_objectives, steps[].',
  ].join('\n');
}

async function callChat(baseUrl: string, payload: any) {
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'ALAIN-Beginner-Lesson/1.0'
  };
  // Local runtimes accept any non-empty key; use placeholder if present
  const apiKey = process.env.OPENAI_API_KEY || 'local-key';
  headers['Authorization'] = `Bearer ${apiKey}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

function extractFunctionArgs(data: any): Lesson | null {
  try {
    const choice = data?.choices?.[0];
    const msg = choice?.message || {};
    const toolCalls = Array.isArray(msg?.tool_calls) ? msg.tool_calls : [];
    if (toolCalls.length > 0) {
      const fn = toolCalls[0]?.function;
      const args = fn?.arguments;
      if (args && typeof args === 'string') {
        return JSON.parse(args) as Lesson;
      }
    }
    return null;
  } catch { return null; }
}

function maybeParseJson(text?: string): Lesson | null {
  if (!text) return null;
  try {
    let t = text.trim();
    if (t.startsWith('```')) t = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(t);
  } catch { return null; }
}

async function run() {
  const start = Date.now();
  const { baseUrl, model } = pickEndpointAndModel();
  console.log('🚀 Beginner Lesson Test (Local OpenAI-compatible)');
  console.log(`🔗 Base URL: ${baseUrl}`);
  console.log(`🧠 Model: ${model}`);
  console.log(`📚 HF: ${HF_URL}`);

  const messages = [
    { role: 'system', content: 'You are ALAIN’s teacher AI. Respond concisely; no chain-of-thought.' },
    { role: 'user', content: buildBeginnerLessonPrompt() },
  ];

  // First try with function-calling
  const payloadWithTools: any = {
    model,
    messages,
    tools: [{ type: 'function', function: FUNCTION_EMIT_LESSON }],
    temperature: 0.2,
    max_tokens: 4096,
  };

  const r1 = await callChat(baseUrl, payloadWithTools);
  let lesson: Lesson | null = null;
  let method: 'function' | 'text' | 'json_mode' | 'unknown' = 'unknown';

  if (r1.ok) {
    lesson = extractFunctionArgs(r1.data);
    if (lesson) method = 'function';
  }

  // Fallback: ask for strict JSON text
  if (!lesson) {
    const payloadText: any = {
      model,
      messages: [
        ...messages,
        { role: 'user', content: 'If tools are unavailable, output only a strict JSON object per the requested fields. No markdown fences.' }
      ],
      temperature: 0.2,
      max_tokens: 4096,
    };
    const r2 = await callChat(baseUrl, payloadText);
    if (r2.ok) {
      const text = r2.data?.choices?.[0]?.message?.content || '';
      const parsed = maybeParseJson(text);
      if (parsed) { lesson = parsed; method = 'text'; }
    }
  }

  // Optional JSON mode (some runtimes support it)
  if (!lesson) {
    const payloadJson: any = {
      model,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 4096,
    };
    const r3 = await callChat(baseUrl, payloadJson);
    if (r3.ok) {
      const text = r3.data?.choices?.[0]?.message?.content || '';
      const parsed = maybeParseJson(text);
      if (parsed) { lesson = parsed; method = 'json_mode'; }
    }
  }

  // Save outputs
  const outDir = join(process.cwd(), '..', 'hackathon-notes', 'test-log-output');
  mkdirSync(outDir, { recursive: true });
  const stamp = Date.now();
  const rawFile = join(outDir, `beginner-lesson-raw-${stamp}.json`);
  const sumFile = join(outDir, `beginner-lesson-summary-${stamp}.md`);

  writeFileSync(rawFile, JSON.stringify({ baseUrl, model, method, responses: { r1: r1.data }, lesson }, null, 2));

  const secs = Math.round((Date.now() - start) / 1000);
  const ok = !!lesson;
  const stepCount = Array.isArray(lesson?.steps) ? lesson!.steps.length : 0;
  const md: string[] = [];
  md.push(`# Beginner Lesson Test — gpt-oss-20b`);
  md.push(`Date: ${now()}`);
  md.push('');
  md.push(`- Base URL: ${baseUrl}`);
  md.push(`- Model: ${model}`);
  md.push(`- HF: ${HF_URL}`);
  md.push(`- Method: ${method}`);
  md.push(`- Status: ${ok ? 'SUCCESS' : 'FAIL'}`);
  md.push(`- Duration: ${secs}s`);
  if (ok) {
    md.push(`- Title: ${lesson!.title || '(none)'}`);
    md.push(`- Steps: ${stepCount}`);
  }
  writeFileSync(sumFile, md.join('\n'));

  if (ok) {
    console.log(`✅ Beginner lesson generated via ${method}.`);
    console.log(`💾 Saved raw JSON: ${rawFile}`);
    console.log(`📝 Summary: ${sumFile}`);
    process.exit(0);
  } else {
    console.error('❌ Failed to generate a structured beginner lesson.');
    console.error('Check that your local endpoint is up and the model id matches.');
    console.error(`Tried: ${baseUrl} with model ${model}`);
    console.log(`Raw saved to: ${rawFile}`);
    process.exit(1);
  }
}

run().catch(err => {
  console.error('💥 Test crashed:', err);
  process.exit(1);
});

