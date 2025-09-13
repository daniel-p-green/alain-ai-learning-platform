import { NextResponse } from "next/server";
import { poeProvider, openAIProvider } from "@/lib/providers";
import { parseHarmonyPrompt, buildMessagesForProvider } from "@/lib/harmony";
import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";

function mapPhaseToPrompt(phase: string): string | null {
  const p = phase.toLowerCase();
  if (p === 'research' || p === 'design' || p === 'develop' || p === 'validate') return `${p}.harmony.txt`;
  return null;
}

function selectProvider(name: string) {
  return name === 'openai-compatible' ? openAIProvider : poeProvider;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const phase = String(body?.phase || "").trim();
    const providerName: string = body?.provider === 'openai-compatible' ? 'openai-compatible' : 'poe';
    const model: string = typeof body?.model === 'string' && body.model.trim() ? String(body.model) : 'GPT-OSS-20B';
    const input: any = body?.input || {};
    const autoRender: boolean = body?.autoRender !== false; // default true

    if (!phase) {
      return NextResponse.json({ ok: false, error: "Missing phase" }, { status: 400 });
    }
    const fileName = mapPhaseToPrompt(phase);
    if (!fileName) {
      return NextResponse.json({ ok: false, error: "Invalid phase" }, { status: 400 });
    }

    // Load Harmony prompt text from repo prompts directory
    const promptPath = path.join(process.cwd(), '..', '..', 'prompts', 'alain-kit', fileName);
    let promptText = '';
    try {
      promptText = await fs.readFile(promptPath, 'utf8');
    } catch (e) {
      return NextResponse.json({ ok: false, error: `Prompt not found: ${fileName}` }, { status: 500 });
    }

    // Build provider-appropriate messages from Harmony prompt + user input
    const context = typeof input === 'string' ? input : JSON.stringify(input, null, 2);
    const sections = parseHarmonyPrompt(promptText);
    const userMessages = [{ role: 'user' as const, content: `Input:\n${context}\n\nProduce the ${phase} phase output.` }];
    const messages = buildMessagesForProvider(providerName as any, sections, userMessages);

    // Execute a non-stream completion via the selected provider
    const provider = selectProvider(providerName);
    const content = await provider.execute({
      provider: providerName as any,
      model,
      messages,
      stream: false,
      temperature: 0.2,
      max_tokens: 1800,
    } as any);

    // For Develop/Validate, attempt to parse JSON and write artifacts
    if (phase.toLowerCase() === 'develop' || phase.toLowerCase() === 'validate') {
      const cleaned = stripCodeFence(content);
      let lesson: any | null = null;
      try { lesson = JSON.parse(cleaned); } catch {}

      const artifacts: any = {};
      if (lesson && typeof lesson === 'object') {
        // Persist lesson JSON under lessons/generated/<provider>/<model>/lesson.json
        const safeModelPath = (model || '').replace(/[^a-zA-Z0-9_.\-\/]/g, '_');
        const modelSegs = safeModelPath.split('/').filter(Boolean);
        const baseDir = path.join(process.cwd(), '..', '..');
        const contentDir = path.join(baseDir, 'content');
        const lessonsDir = path.join(contentDir, 'lessons', providerName, ...modelSegs);
        const notebooksDir = path.join(contentDir, 'notebooks', providerName, ...modelSegs);
        const reportsDir = path.join(contentDir, 'reports', providerName, ...modelSegs);
        await fs.mkdir(lessonsDir, { recursive: true });
        await fs.mkdir(notebooksDir, { recursive: true });
        await fs.mkdir(reportsDir, { recursive: true });
        const lessonPath = path.join(lessonsDir, 'lesson.json');
        await fs.writeFile(lessonPath, JSON.stringify(lesson, null, 2), 'utf8');
        artifacts.lesson_path = relativeFromCwd(lessonPath);

        if (autoRender) {
          const nbPath = path.join(notebooksDir, 'lesson.ipynb');
          const reportPath = path.join(reportsDir, 'validation.json');
          artifacts.notebook_path = relativeFromCwd(nbPath);
          artifacts.smoke_report_path = relativeFromCwd(reportPath);
          try {
            // Render notebook via Python renderer if available
            await execFileP('python3', [path.join(baseDir, 'scripts', 'json_to_notebook.py'), '--in', lessonPath, '--out', nbPath]);
            artifacts.rendered = true;
          } catch (e: any) {
            artifacts.rendered = false;
            artifacts.render_error = e?.message || String(e);
          }
          try {
            // Run smoke (allow missing keys to avoid CI failures locally)
            await execFileP('python3', [path.join(baseDir, 'scripts', 'notebook_smoke.py'), '--in', nbPath, '--out', reportPath, '--first-n', '1', '--timeout', '60', '--allow-missing-keys']);
            // Attach parsed report summary if exists
            const rep = JSON.parse(await fs.readFile(reportPath, 'utf8'));
            artifacts.smoke = rep;
          } catch (e: any) {
            artifacts.smoke_error = e?.message || String(e);
          }
        }
      }

      return NextResponse.json({ ok: true, phase, provider: providerName, model, content, artifacts });
    }

    return NextResponse.json({ ok: true, phase, provider: providerName, model, content });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export const runtime = 'nodejs';

function stripCodeFence(txt: string): string {
  const t = String(txt || '').trim();
  if (t.startsWith('```')) {
    return t.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
  }
  return t;
}

function execFileP(cmd: string, args: string[]): Promise<{ code: number }> {
  return new Promise((resolve, reject) => {
    const child = execFile(cmd, args, { env: process.env });
    let stderr = '';
    child.stderr?.on('data', (d) => { stderr += String(d); });
    child.on('exit', (code) => {
      if (code === 0) resolve({ code: 0 });
      else reject(new Error(stderr || `${cmd} exited with code ${code}`));
    });
    child.on('error', (err) => reject(err));
  });
}

function relativeFromCwd(p: string): string {
  try { return path.relative(process.cwd(), p) || p; } catch { return p; }
}
