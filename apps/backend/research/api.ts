import { api, APIError } from "encore.dev/api";
import { researchModel } from "../utils/research";
import * as fs from "fs/promises";
import * as path from "path";

const REPO_ROOT = path.join(__dirname, '..', '..', '..');

interface RunResearchRequest {
  model: string; // repo name, e.g. gpt-oss-20b
  provider?: string; // HF owner/org, e.g. openai
  offlineCache?: boolean;
  depth?: 'basic' | 'intermediate' | 'advanced';
  githubToken?: string;
  kaggle?: { username?: string; key?: string };
}

interface RunResearchResponse {
  success: boolean;
  dir?: string;
  summaryV2?: any;
  error?: { code: string; message: string };
}

export const runResearch = api<RunResearchRequest, RunResearchResponse>(
  { expose: true, method: "POST", path: "/research/run" },
  async (req, _ctx) => {
    try {
      const model = (req.model || '').trim();
      const provider = (req.provider || '').trim();
      if (!model) throw APIError.invalidArgument('model is required');
      if (!provider) throw APIError.invalidArgument('provider is required');

      // Write to repo-level resources/content directory
      const dir = await researchModel(model, provider, REPO_ROOT, {
        offlineCache: !!req.offlineCache,
        githubToken: req.githubToken,
        kaggle: req.kaggle,
        // "depth" currently influences enhanced research path; basic pipeline still runs
        // This parameter is kept for future evolution.
      });

      // Try to read V2 summary if present
      let summary: any = undefined;
      try {
        const v2Path = path.join(dir, 'research-summary.v2.json');
        const raw = await fs.readFile(v2Path, 'utf-8');
        summary = JSON.parse(raw);
      } catch {}

      return { success: true, dir, summaryV2: summary };
    } catch (e: any) {
      const msg = e?.message || 'Failed to run research';
      return { success: false, error: { code: 'research_error', message: msg } };
    }
  }
);

