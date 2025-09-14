/**
 * Robust JSON extraction from LLM responses that may contain extra text.
 * Returns the first top-level balanced JSON object found, or null.
 */
export function extractJsonLoose(input: string): any | null {
  if (!input) return null;
  const start = input.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const slice = input.slice(start, i + 1);
        try { return JSON.parse(slice); } catch {}
      }
    }
  }
  // Fallback: try trimming to outermost braces even if mismatched
  const end = input.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(input.slice(start, end + 1)); } catch {}
  }
  return null;
}

