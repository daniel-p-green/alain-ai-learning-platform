import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const cache = new Map();
function resolvePromptPath(fileName) {
    const customRoot = (process.env.ALAIN_PROMPT_ROOT || '').trim();
    const searchRoots = [
        customRoot || undefined,
        path.resolve(moduleDir, '../../../resources/prompts/alain-kit'),
        path.resolve(process.cwd(), 'resources/prompts/alain-kit')
    ].filter(Boolean);
    for (const root of searchRoots) {
        const abs = path.join(root, fileName);
        if (fs.existsSync(abs))
            return abs;
    }
    return undefined;
}
export function loadPromptTemplate(fileName) {
    if (!fileName) {
        throw new Error('ALAIN prompt template name is required');
    }
    if (cache.has(fileName))
        return cache.get(fileName);
    const abs = resolvePromptPath(fileName);
    if (!abs) {
        throw new Error(`ALAIN prompt template not found: ${fileName}`);
    }
    const content = fs.readFileSync(abs, 'utf8');
    cache.set(fileName, content);
    return content;
}
export function applyTemplate(template, replacements) {
    let output = template;
    for (const [key, value] of Object.entries(replacements)) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const token = new RegExp(escapedKey, 'g');
        const safe = String(value ?? '').replace(/\$/g, '$$$$');
        output = output.replace(token, safe);
    }
    return output;
}
//# sourceMappingURL=prompt-loader.js.map