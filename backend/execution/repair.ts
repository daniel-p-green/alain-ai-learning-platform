import { api, APIError } from "encore.dev/api";
import { teacherGenerate } from "./teacher";
import { parseHfUrl } from "../utils/hf";
import { applyDefaults, validateLesson } from "./spec/lessonSchema";

interface RepairRequest {
  hfUrl: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  teacherModel?: "GPT-OSS-20B" | "GPT-OSS-120B";
  fixes?: Array<"add_description" | "add_intro_step" | "compact_steps">;
}

interface RepairResponse {
  success: boolean;
  lesson?: any;
  error?: { code: string; message: string; details?: any };
}

export const repairLesson = api<RepairRequest, RepairResponse>(
  { expose: true, method: "POST", path: "/lessons/repair" },
  async (req) => {
    if (!req?.hfUrl) throw APIError.invalidArgument("hfUrl required");
    const teacherModel = req.teacherModel || "GPT-OSS-20B";
    const fixes = new Set(req.fixes || []);

    const modelInfo = await extractHFModelInfoLite(req.hfUrl);
    const base = buildLessonGenerationPrompt(modelInfo, req.difficulty, true);

    const extra: string[] = [];
    if (fixes.has("add_description")) extra.push("Ensure a concise, high-quality description is present (2-3 sentences).");
    if (fixes.has("add_intro_step")) extra.push("If steps are missing, create an introductory step that explains the model and provides a tiny runnable prompt.");
    if (fixes.has("compact_steps")) extra.push("Limit to 3 solid steps with clear titles and runnable prompts.");

    const prompt = extra.length ? `${base}\n\nRepairs to apply:\n- ${extra.join("\n- ")}` : base;

    const resp = await teacherGenerate({
      model: teacherModel,
      messages: [{ role: "user", content: prompt }],
      task: "lesson_generation",
      temperature: 0.2,
      max_tokens: 4096,
    });

    if (!resp.success || !resp.content) {
      return { success: false, error: { code: "repair_failed", message: resp.error?.message || "Teacher repair failed" } };
    }

    try {
      const parsed = parseGeneratedLessonLite(resp.content);
      const lesson = applyDefaults(parsed, req.difficulty, modelInfo);
      const v = validateLesson(lesson);
      if (!v.valid) return { success: false, error: { code: "validation_error", message: "Lesson invalid after repair", details: v.errors } };
      return { success: true, lesson };
    } catch (e: any) {
      return { success: false, error: { code: "parse_error", message: e?.message || String(e) } };
    }
  }
);

async function extractHFModelInfoLite(hfUrl: string) {
  try {
    const { owner, repo } = parseHfUrl(hfUrl);
    return { name: repo, org: owner, url: `https://huggingface.co/${owner}/${repo}`, card: null };
  } catch {
    // Try strict owner/repo shorthand (no scheme, no extra path)
    const m = hfUrl.trim().match(/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/);
    if (m) {
      const [owner, repo] = hfUrl.trim().split('/') as [string, string];
      return { name: repo, org: owner, url: `https://huggingface.co/${owner}/${repo}`, card: null };
    }
    throw APIError.invalidArgument("Invalid Hugging Face URL format");
  }
}

function buildLessonGenerationPrompt(modelInfo: any, difficulty: string, includeAssessment?: boolean): string {
  const basePrompt = `Generate a comprehensive, structured lesson for the AI model: ${modelInfo.name}

Model Information:
- Organization: ${modelInfo.org}
- URL: ${modelInfo.url}
- Difficulty Level: ${difficulty}

Requirements:
1. Create 3-5 progressive lesson steps
2. Include practical examples and code snippets
3. Focus on real-world applications
4. Provide clear learning objectives
5. Include model maker information when available

${includeAssessment ? '6. Generate 3-5 multiple choice questions with explanations' : ''}

Format your response as a JSON object with this structure:
{"title":"...","description":"...","learning_objectives":[],"steps":[{"step_order":1,"title":"...","content":"...","code_template":"...","expected_output":"...","model_params":{"temperature":0.7}}]}`;
  return basePrompt;
}

function parseGeneratedLessonLite(content: string) {
  let clean = content.trim();
  if (clean.startsWith("```json")) clean = clean.replace(/^```json\n?/, "").replace(/\n?```$/, "");
  else if (clean.startsWith("```")) clean = clean.replace(/^```\w*\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(clean);
}
