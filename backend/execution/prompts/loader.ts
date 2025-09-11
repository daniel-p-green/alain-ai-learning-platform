import fs from "fs";
import path from "path";

type Sections = { system: string; developer: string };

const START = "<|start|>";
const END = "<|end|>";
const MESSAGE = "<|message|>";

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
  const raw = fs.readFileSync(p, "utf8");
  return parseHarmonyPrompt(raw);
}

// Convenience loader for ALAIN-Kit phase prompts.
export function loadAlainKitPrompt(phase: "research" | "design" | "develop" | "validate" | "orchestrator"): Sections {
  const rel = path.join("prompts", "alain-kit", `${phase}.harmony.txt`);
  return loadHarmonyPrompt(rel);
}
