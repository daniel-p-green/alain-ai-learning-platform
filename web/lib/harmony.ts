export type HarmonySections = { system: string; developer: string };

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

// Parse a Harmony prompt string and return only the instruction bodies
export function parseHarmonyPrompt(raw: string): HarmonySections {
  const system = extractRole(raw, "system");
  const developer = extractRole(raw, "developer");
  return { system, developer };
}

export type WebMessage = { role: "system" | "developer" | "user" | "assistant"; content: string };

// Build provider-appropriate messages for a Harmony prompt + user messages.
// - For 'openai-compatible': keep separate system + developer roles
// - For 'poe': fold developer into system and omit the developer role
export function buildMessagesForProvider(
  provider: "poe" | "openai-compatible",
  prompt: HarmonySections,
  userMessages: Array<Pick<WebMessage, "role" | "content">>
): WebMessage[] {
  const foldDevForOpenAICompat = (() => {
    try {
      const v = (process.env.OPENAI_COMPAT_FOLD_DEVELOPER || "").toLowerCase();
      return v === "1" || v === "true" || v === "yes" || v === "on";
    } catch {
      return false;
    }
  })();
  const supportsHarmonyRoles = provider === "openai-compatible" && !foldDevForOpenAICompat;
  if (supportsHarmonyRoles) {
    const sys: WebMessage = { role: "system", content: prompt.system };
    const dev: WebMessage = { role: "developer", content: prompt.developer } as any;
    return [sys, dev, ...userMessages];
  }
  const downgradedSystem: WebMessage = {
    role: "system",
    content: [prompt.system, prompt.developer].filter(Boolean).join("\n\n"),
  } as any;
  return [downgradedSystem, ...userMessages];
}
