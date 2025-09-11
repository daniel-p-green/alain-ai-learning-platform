import fs from "fs";
import path from "path";

type Sections = { system: string; developer: string };

const START = "<|start|>";
const END = "<|end|>";
const MESSAGE = "<|message|>";

// Simple in-memory cache to avoid repeated disk reads
const cache = new Map<string, Sections>();

function extractRole(raw: string, role: string): string {
  const header = `${START}${role}${MESSAGE}`;
  const i = raw.indexOf(header);
  if (i === -1) return "";
  const from = i + header.length;
  const j = raw.indexOf(END, from);
  const body = j === -1 ? raw.slice(from) : raw.slice(from, j);
  return body.trim();
}

// Parse a Harmony prompt file and extract only the instruction content
// from the <|start|>system and <|start|>developer blocks.
// Any inline examples (assistant/user, tool call transcripts) are ignored.
export function parseHarmonyPrompt(raw: string): Sections {
  const system = extractRole(raw, "system");
  const developer = extractRole(raw, "developer");
  return { system, developer };
}

// Load a Harmony prompt from disk, returning only { system, developer } bodies.
export function loadHarmonyPrompt(relOrAbsPath: string): Sections {
  const p = path.isAbsolute(relOrAbsPath)
    ? relOrAbsPath
    : path.resolve(process.cwd(), relOrAbsPath);
  const key = `file:${p}`;
  if (cache.has(key)) return cache.get(key)!;
  const raw = fs.readFileSync(p, "utf8");
  const sections = parseHarmonyPrompt(raw);
  cache.set(key, sections);
  return sections;
}

// Convenience loader for ALAIN-Kit phase prompts.
export function loadAlainKitPrompt(phase: "research" | "design" | "develop" | "validate" | "orchestrator"): Sections {
  const customRoot = (process.env.PROMPT_ROOT || "").trim();
  const candidates = [
    customRoot ? path.join(customRoot, `${phase}.harmony.txt`) : "",
    path.resolve(__dirname, "../../../prompts/alain-kit", `${phase}.harmony.txt`),
    path.resolve(process.cwd(), "prompts/alain-kit", `${phase}.harmony.txt`),
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return loadHarmonyPrompt(p);
    } catch {}
  }
  // Last resort: attempt CWD relative and throw if missing
  const fallback = path.resolve(process.cwd(), "prompts/alain-kit", `${phase}.harmony.txt`);
  return loadHarmonyPrompt(fallback);
}
