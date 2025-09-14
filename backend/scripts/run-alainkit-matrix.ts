#!/usr/bin/env tsx
/**
 * Run ALAIN‑Kit phases for a target HF model across multiple Poe models
 * and save detailed logs (raw + evaluations) under hackathon-notes/test-log-output.
 *
 * Usage:
 *   POE_API_KEY=... tsx backend/scripts/run-alainkit-matrix.ts
 */

import { mkdir, writeFile, readFile } from 'fs/promises';
import path from 'path';

type PhaseId = 'research' | 'lesson_generation' | 'assessment_creation' | 'content_adaptation' | 'notebook_generation';

const HF_MODEL_ID = 'TinyLlama/TinyLlama-1.1B-Chat-v1.0';
const HF_URL = `https://huggingface.co/${HF_MODEL_ID}`;

// Models to test on Poe (as requested)
const POE_MODELS = [
  'GPT-OSS-20B',
  'GPT-OSS-120B',
  'gpt-5-chat',
  'gpt-5',
  'gpt-5-mini',
  'GPT-OSS-120B-T',
  'GPT-OSS-120B-CS',
  'OpenAI-GPT-OSS-20B',
  'GPT-OSS-20B-T',
];

const PHASES: PhaseId[] = [
  'research',
  'lesson_generation',
  'assessment_creation',
  'content_adaptation',
  // Optional: include notebook_generation as a textual generation phase
  'notebook_generation',
];

function nowIso() { return new Date().toISOString(); }

function buildToolsForPhase(phase: PhaseId) {
  if (phase === 'research') {
    return [
      {
        type: 'function',
        function: {
          name: 'emit_research_findings',
          description: 'Return structured, comprehensive research findings for a model.',
          parameters: { type: 'object', additionalProperties: true },
        }
      }
    ];
  }
  if (phase === 'lesson_generation') {
    return [
      {
        type: 'function',
        function: {
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
        }
      }
    ];
  }
  return [];
}

function buildMessagesForPhase(phase: PhaseId) {
  const system = {
    role: 'system',
    content: [
      'You are ALAIN’s teacher AI. Respond concisely; no chain-of-thought.',
      'When asked for structured output, return a single strict JSON object without markdown fences.'
    ].join('\n')
  };

  const userContentByPhase: Record<PhaseId, string> = {
    research: `Conduct comprehensive research on the model: ${HF_MODEL_ID}.

HUGGING FACE URL: ${HF_URL}
RESEARCH OBJECTIVES:
- Analyze model architecture, training data, capabilities, and limitations
- Extract technical specs and licensing
- Identify educational pathways, prerequisites, and learning objectives
- Provide implementation guidance and best practices
- Cite key community resources (papers, repos, tutorials)

Use the emit_research_findings function to return structured JSON.`,

    lesson_generation: `Generate a structured beginner-to-intermediate lesson centered on ${HF_MODEL_ID}.
Audience: learners familiar with Python and basic ML
Include: title, description, learning objectives, and 4–6 steps with code snippets.
Prefer concise, runnable examples using Hugging Face Transformers where applicable.
Return via emit_lesson function when supported, else output a strict JSON object.`,

    assessment_creation: `Create 6 multiple-choice questions (MCQs) evaluating understanding of ${HF_MODEL_ID}.
Include: question, 4 options (A–D), correct answer, and a short explanation.
Output a strict JSON object: { questions: [{ question, options: [..], answer, explanation }] }.`,

    content_adaptation: `Adapt a short primer on ${HF_MODEL_ID} for a learner who struggled with attention mechanisms (score 45%).
Goal: simplify concepts, add analogies, and propose 2 remedial exercises.
Output a strict JSON object: { overview, simplified_explanations: [...], exercises: [...] }.`,

    notebook_generation: `Produce a Jupyter-notebook style lesson outline for ${HF_MODEL_ID}.
Include sections: introduction, setup, tokenization, simple chat/inference example, and troubleshooting.
Output a strict JSON object: { title, cells: [{type, content}], requirements: [...] }.`,
  };

  return [system, { role: 'user', content: userContentByPhase[phase] }];
}

function scoreCompleteness(phase: PhaseId, content: any): number {
  try {
    if (!content) return 0;
    switch (phase) {
      case 'research': {
        const keys = ['model_name','technical_specs','educational_context'];
        const hit = keys.filter(k => k in content).length;
        return Math.round((hit / keys.length) * 100);
      }
      case 'lesson_generation': {
        const has = (k: string) => k in content;
        const steps = Array.isArray(content?.steps) ? 1 : 0;
        const base = ['title','description','learning_objectives'];
        const hit = base.filter(has).length + steps;
        return Math.round((hit / (base.length + 1)) * 100);
      }
      case 'assessment_creation': {
        const qs = Array.isArray(content?.questions) ? content.questions.length : 0;
        return Math.min(100, Math.round((qs / 6) * 100));
      }
      case 'content_adaptation': {
        const keys = ['overview','simplified_explanations','exercises'];
        const hit = keys.filter(k => k in content).length;
        return Math.round((hit / keys.length) * 100);
      }
      case 'notebook_generation': {
        const keys = ['title','cells','requirements'];
        const hit = keys.filter(k => k in content).length;
        return Math.round((hit / keys.length) * 100);
      }
    }
  } catch {}
  return 0;
}

function scoreAlignment(phase: PhaseId, rawText: string): number {
  // Heuristic: check for banned artifacts and presence of requested elements
  let score = 100;
  if (/```/.test(rawText)) score -= 10; // markdown fences present
  if (/Thinking\.|Chain-of-Thought|Valid channels/i.test(rawText)) score -= 15; // leakage
  if (/\{\s*\}/.test(rawText.trim())) score -= 5; // empty object
  return Math.max(0, Math.min(100, score));
}

function toJsonMaybe(text: string): any | null {
  try {
    let t = (text || '').trim();
    if (!t) return null;
    if (t.startsWith('```')) t = t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(t);
  } catch { return null; }
}

async function callPoe(model: string, messages: any[], tools?: any[]) {
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) throw new Error('POE_API_KEY not set');
  const body: any = { model, messages, temperature: 0.2, max_tokens: 4096 };
  if (tools && tools.length > 0) body.tools = tools;
  const resp = await fetch('https://api.poe.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  return data;
}

function extractStructured(data: any): { json: any | null; text: string } {
  const choice = data?.choices?.[0];
  const msg = choice?.message || {};
  const text = String(msg?.content || '');
  const toolCalls = Array.isArray(msg?.tool_calls) ? msg.tool_calls : [];
  if (toolCalls.length > 0) {
    const fn = toolCalls[0]?.function;
    const args = fn?.arguments;
    if (args && typeof args === 'string') {
      try { return { json: JSON.parse(args), text: text || args }; } catch {}
    }
  }
  // Try parse text
  const parsed = toJsonMaybe(text);
  return { json: parsed, text };
}

async function main() {
  const stamp = Date.now();
  const rootOut = path.join(process.cwd(), 'hackathon-notes', 'test-log-output', `tinyllama_${stamp}`);
  await mkdir(rootOut, { recursive: true });

  const summary: any = {
    timestamp: nowIso(),
    target_hf_model: HF_MODEL_ID,
    poe_models: POE_MODELS,
    phases: PHASES,
    results: [] as any[],
  };

  for (const model of POE_MODELS) {
    const modelDir = path.join(rootOut, model.replace(/[^a-z0-9._-]+/gi, '_'));
    await mkdir(modelDir, { recursive: true });
    const modelEntry: any = { model, phases: [] as any[] };

    for (const phase of PHASES) {
      const phaseOut = path.join(modelDir, `${phase}.json`);
      const messages = buildMessagesForPhase(phase);
      const tools = buildToolsForPhase(phase);

      let resultRecord: any = { phase, success: false };
      try {
        const data = await callPoe(model, messages as any, tools as any);
        const { json, text } = extractStructured(data);
        const completeness = scoreCompleteness(phase, json || null);
        const alignment = scoreAlignment(phase, json ? JSON.stringify(json) : text);

        const record = {
          model,
          phase,
          request: { messages, tools },
          response: data,
          extracted: { structured: json, fallback_text: json ? undefined : text },
          evaluation: {
            completeness,
            alignment,
            notes: (json ? 'Parsed structured output' : 'No tools/JSON; used text fallback'),
          },
        };
        await writeFile(phaseOut, JSON.stringify(record, null, 2));
        resultRecord = { phase, success: true, completeness, alignment, path: phaseOut };
      } catch (error: any) {
        const errMsg: string = error?.message || String(error);
        // Fallback: if tools unsupported or function schema rejected, retry without tools and with JSON-only hint
        const shouldFallback = /unsupported_feature_for_model|does not support tool calling|invalid_function_parameters/i.test(errMsg);
        if (shouldFallback) {
          try {
            const noToolMessages = [...messages];
            // append a hint to enforce JSON-only output
            (noToolMessages as any[]).push({ role: 'user', content: 'If tools are unavailable, output a single strict JSON object exactly per the request schema, with no markdown fences or extra prose.' });
            const data2 = await callPoe(model, noToolMessages as any, undefined);
            const { json, text } = extractStructured(data2);
            const completeness = scoreCompleteness(phase, json || null);
            const alignment = scoreAlignment(phase, json ? JSON.stringify(json) : text);
            const record = {
              model,
              phase,
              request: { messages: noToolMessages, tools: undefined },
              response: data2,
              extracted: { structured: json, fallback_text: json ? undefined : text },
              evaluation: {
                completeness,
                alignment,
                notes: `Fallback (no tools) after error: ${errMsg}`,
              },
            };
            await writeFile(phaseOut, JSON.stringify(record, null, 2));
            resultRecord = { phase, success: true, completeness, alignment, path: phaseOut };
          } catch (error2: any) {
            const errRec = {
              model,
              phase,
              error: { message: errMsg, fallback_error: error2?.message || String(error2) },
            };
            await writeFile(phaseOut, JSON.stringify(errRec, null, 2));
            resultRecord = { phase, success: false, error: `${errMsg} | fallback: ${error2?.message}`, path: phaseOut };
          }
        } else {
          const errRec = {
            model,
            phase,
            error: { message: errMsg },
          };
          await writeFile(phaseOut, JSON.stringify(errRec, null, 2));
          resultRecord = { phase, success: false, error: errMsg, path: phaseOut };
        }
      }
      modelEntry.phases.push(resultRecord);
    }

    summary.results.push(modelEntry);
  }

  const summaryPath = path.join(rootOut, 'SUMMARY.json');
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));

  const mdLines: string[] = [];
  mdLines.push(`# ALAIN‑Kit Test Log — TinyLlama ${new Date(stamp).toISOString()}`);
  mdLines.push(`Target HF model: ${HF_MODEL_ID}`);
  mdLines.push('');
  for (const m of summary.results) {
    mdLines.push(`## Model: ${m.model}`);
    for (const ph of m.phases) {
      mdLines.push(`- ${ph.phase}: ${ph.success ? '✅' : '❌'} (${ph.path})` + (ph.success ? ` — completeness: ${ph.completeness}%, alignment: ${ph.alignment}%` : ` — error: ${ph.error}`));
    }
    mdLines.push('');
  }
  await writeFile(path.join(rootOut, 'SUMMARY.md'), mdLines.join('\n'));

  console.log('✅ Completed. Output saved under:', rootOut);
}

main().catch(err => {
  console.error('💥 Failed to run matrix:', err);
  process.exit(1);
});
