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
// Accepts flexible phase identifiers such as:
//  - research | design | develop | validate | orchestrator
//  - research.offline | orchestrator.offline | cache.management
//  - with suffixes: .harmony | .harmony.txt | .txt
//  - or a direct path to a .txt file
export function loadAlainKitPrompt(phase: string): Sections {
  const requested = (phase || "").trim();
  if (!requested) throw new Error("loadAlainKitPrompt: phase is empty");

  // If explicit path provided ending with .txt, load directly
  const looksLikePath = requested.includes("/") || requested.includes("\\");
  if (looksLikePath && requested.endsWith(".txt")) {
    if (!fs.existsSync(requested)) {
      throw new Error(`Prompt file not found: ${requested}`);
    }
    return loadHarmonyPrompt(requested);
  }

  // Normalize base name variants
  const withoutTxt = requested.replace(/\.txt$/i, "");
  const withoutHarmony = withoutTxt.replace(/\.harmony$/i, "");
  const withoutOfflineHarmony = withoutTxt.replace(/\.offline\.harmony$/i, "");
  const baseCandidates = Array.from(new Set([requested, withoutTxt, withoutHarmony, withoutOfflineHarmony].filter(Boolean)));

  // Generate filename candidates in priority order
  const fileNameCandidates: string[] = [];
  for (const base of baseCandidates) {
    // Explicit offline.harmony if signaled with ".offline"
    if (/\.offline$/i.test(base)) {
      const b = base.replace(/\.offline$/i, "");
      fileNameCandidates.push(`${b}.offline.harmony.txt`);
    }
    if (/\.harmony$/i.test(base)) {
      // If already contains .harmony, ensure the .txt suffix
      fileNameCandidates.push(`${base}.txt`);
    }
    // Canonical harmony filename
    fileNameCandidates.push(`${base}.harmony.txt`);
    // Plain .txt fallback
    fileNameCandidates.push(`${base}.txt`);
  }

  const customRoot = (process.env.PROMPT_ROOT || "").trim();
  const searchRoots = Array.from(new Set([
    customRoot || undefined,
    path.resolve(__dirname, "../../../prompts/alain-kit"),
    path.resolve(process.cwd(), "prompts/alain-kit"),
  ].filter(Boolean) as string[]));

  const tried: string[] = [];
  for (const root of searchRoots) {
    for (const name of fileNameCandidates) {
      const p = path.join(root, name);
      tried.push(p);
      try {
        if (fs.existsSync(p)) return loadHarmonyPrompt(p);
      } catch {}
    }
  }

  const msg = `loadAlainKitPrompt: could not find prompt for phase '${requested}'. Tried:\n` + tried.join("\n");
  throw new Error(msg);
}
