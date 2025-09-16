import { api, APIError } from "encore.dev/api";
import { requireUserId } from "../auth";
import { allowRate } from "../utils/ratelimit";
import { validateBackendEnv } from "../config/env";
import { teacherGenerate } from "./teacher";

interface AdaptRequest {
  tutorialId?: number; // optional metadata
  stepOrder?: number;  // optional metadata
  current_content: string;
  user_performance: number; // 0–100
  target_difficulty: "beginner" | "intermediate" | "advanced";
  provider?: "poe" | "openai-compatible";
}

interface AdaptResponse {
  success: boolean;
  adapted?: string;
  error?: { code: string; message: string };
}

export const adaptContent = api<AdaptRequest, AdaptResponse>(
  { expose: true, method: "POST", path: "/adapt" },
  async (req) => {
    try {
      validateBackendEnv();
      const userId = await requireUserId();
      const gate = allowRate(userId, 'adapt', Number(process.env.ADAPT_MAX_RPM || 20), 60_000);
      if (!gate.ok) throw APIError.resourceExhausted(`Rate limited. Try again in ${gate.retryAfter}s`);

      if (!req.current_content || typeof req.current_content !== 'string') {
        throw APIError.invalidArgument("current_content required");
      }
      const perf = Number(req.user_performance);
      if (Number.isNaN(perf) || perf < 0 || perf > 100) {
        throw APIError.invalidArgument("user_performance must be 0–100");
      }
      if (!['beginner','intermediate','advanced'].includes(req.target_difficulty)) {
        throw APIError.invalidArgument("target_difficulty invalid");
      }

      const prompt = `Adapt the following learning step content for a ${req.target_difficulty} learner.\n`+
        `The user performance score is ${perf}/100 (higher means doing well).\n`+
        `Keep code examples concise, and clarify explanations as needed.\n`+
        `Return only the adapted content (markdown), no additional commentary.\n\n`+
        `CONTENT:\n${req.current_content}`;

      const resp = await teacherGenerate({
        model: 'GPT-OSS-20B',
        messages: [{ role: 'user', content: prompt }],
        task: 'content_adaptation',
        provider: req.provider,
      } as any);

      if (!resp.success || !resp.content) {
        throw APIError.internal(resp.error?.message || 'adaptation failed');
      }
      return { success: true, adapted: resp.content };
    } catch (err) {
      const msg = err instanceof APIError ? err.message : (err instanceof Error ? err.message : 'adapt error');
      return { success: false, error: { code: 'adapt_error', message: msg } };
    }
  }
);
