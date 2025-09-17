import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

const cache = new Map<string, string>();

function resolvePromptPath(fileName: string): string | undefined {
  const customRoot = (process.env.ALAIN_PROMPT_ROOT || '').trim();
  const candidateBases = [
    moduleDir,
    path.resolve(moduleDir, '..'),
    path.resolve(moduleDir, '..', '..'),
    path.resolve(moduleDir, '..', '..', '..'),
    process.cwd()
  ];
  const searchRoots = [
    customRoot || undefined,
    ...candidateBases.map(base => path.resolve(base, 'resources/prompts/alain-kit'))
  ].filter(Boolean) as string[];

  for (const root of searchRoots) {
    const abs = path.join(root, fileName);
    if (fs.existsSync(abs)) return abs;
  }
  return undefined;
}

export function loadPromptTemplate(fileName: string): string {
  if (!fileName) {
    throw new Error('ALAIN prompt template name is required');
  }
  if (cache.has(fileName)) return cache.get(fileName)!;
  const abs = resolvePromptPath(fileName);
  if (!abs) {
    throw new Error(`ALAIN prompt template not found: ${fileName}`);
  }
  const content = fs.readFileSync(abs, 'utf8');
  cache.set(fileName, content);
  return content;
}

export function applyTemplate(template: string, replacements: Record<string, string | undefined>): string {
  let output = template;
  for (const [key, value] of Object.entries(replacements)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const token = new RegExp(escapedKey, 'g');
    const safe = String(value ?? '').replace(/\$/g, '$$$$');
    output = output.replace(token, safe);
  }
  return output;
}
