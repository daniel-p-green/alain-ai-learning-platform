import { api } from "encore.dev/api";
import { tutorialsDB } from "./db";

interface SeedResponse { inserted: boolean; tutorialIds?: number[] }

// Inserts one sample tutorial with 2 steps if none exist.
export const seed = api<void, SeedResponse>(
  { expose: true, method: "POST", path: "/seed" },
  async () => {
    const existing = await tutorialsDB.queryRow<{ count: number }>`SELECT COUNT(*)::int as count FROM tutorials`;
    if ((existing?.count ?? 0) > 0) {
      return { inserted: false };
    }

    // Insert model makers
    const metaMaker = await tutorialsDB.queryRow<{ id: number }>`
      INSERT INTO model_makers (name, org_type, homepage, license, repo)
      VALUES ('Meta AI', 'company', 'https://ai.meta.com/', 'Llama 3 community license', 'https://github.com/meta-llama/llama3')
      RETURNING id
    `;
    const mistralMaker = await tutorialsDB.queryRow<{ id: number }>`
      INSERT INTO model_makers (name, org_type, homepage, license, repo)
      VALUES ('Mistral AI', 'company', 'https://mistral.ai/', 'Apache-2.0', 'https://github.com/mistralai')
      RETURNING id
    `;

    // Tutorial 1: Llama 3.1 basics (runs on local/OpenAI-compatible by default)
    const llama = await tutorialsDB.queryRow<{ id: number }>`
      INSERT INTO tutorials (title, description, model, provider, difficulty, tags, model_maker_id)
      VALUES (
        'Llama 3.1: Structured Output Basics',
        'Practice instruction following and producing JSON that matches a simple schema.',
        'gpt-oss:20b',
        'openai-compatible',
        'beginner',
        ARRAY['llama','json','beginner'],
        ${metaMaker!.id}
      ) RETURNING id
    `;
    const llamaId = llama!.id;
    await tutorialsDB.exec`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
      VALUES
        (
          ${llamaId}, 1,
          'Warm-up: Hello Model',
          'Send a short greeting and confirm the model is reachable.',
          'Say hello from Llama 3.1 and tell me one capability you have.',
          NULL,
          '{"temperature":0.3}'
        ),
        (
          ${llamaId}, 2,
          'JSON Output',
          'Ask the model to emit a JSON object matching a simple schema with fields {"name","skills":[string],"years_experience":number}.',
          'Return a JSON object with fields name, skills (array of 3 strings), and years_experience (integer). Do not include any extra commentary.',
          NULL,
          '{"temperature":0.2}'
        ),
        (
          ${llamaId}, 3,
          'Temperature Control',
          'Experiment with temperature to see how verbosity and randomness change.',
          'Explain the difference between temperature=0.2 and temperature=0.9 in 2-3 sentences. Keep it concise.',
          NULL,
          '{"temperature":0.7}'
        )
    `;
    await tutorialsDB.exec`
      INSERT INTO assessments (tutorial_id, step_order, question, options, correct_index, explanation, difficulty, tags)
      VALUES (
        ${llamaId}, 2,
        'Which parameter most directly controls randomness?',
        ARRAY['max_tokens','temperature','top_p','n'],
        1,
        'Higher temperature generally increases randomness.',
        'beginner',
        ARRAY['parameters','generation']
      )
    `;

    // Tutorial 2: Mistral prompt engineering essentials (uses Poe by default)
    const mistral = await tutorialsDB.queryRow<{ id: number }>`
      INSERT INTO tutorials (title, description, model, provider, difficulty, tags, model_maker_id)
      VALUES (
        'Mistral 7B: Prompt Engineering Essentials',
        'Learn system vs user prompts and refine outputs with iterative edits.',
        'GPT-OSS-20B',
        'poe',
        'intermediate',
        ARRAY['mistral','prompting','intermediate'],
        ${mistralMaker!.id}
      ) RETURNING id
    `;
    const mistralId = mistral!.id;
    await tutorialsDB.exec`
      INSERT INTO tutorial_steps (tutorial_id, step_order, title, content, code_template, expected_output, model_params)
      VALUES
        (
          ${mistralId}, 1,
          'Role and Instructions',
          'Set a clear role and constraints to guide the model output.',
          'You are a terse technical writer. Summarize the benefits of structured outputs in 3 bullets.',
          NULL,
          '{"temperature":0.4}'
        ),
        (
          ${mistralId}, 2,
          'Iterative Refinement',
          'Refine a draft to meet style constraints (tone, length, audience).',
          'Rewrite the previous answer for a non-technical audience in 2 bullets, removing jargon.',
          NULL,
          '{"temperature":0.5}'
        )
    `;
    await tutorialsDB.exec`
      INSERT INTO assessments (tutorial_id, step_order, question, options, correct_index, explanation, difficulty, tags)
      VALUES (
        ${mistralId}, 1,
        'What is the main purpose of a system prompt?',
        ARRAY['Provide examples','Set role/constraints','Increase randomness','Change provider'],
        1,
        'System prompts set the assistant role and high-level constraints.',
        'intermediate',
        ARRAY['prompting','roles']
      )
    `;

    return { inserted: true, tutorialIds: [llamaId, mistralId] };
  }
);
