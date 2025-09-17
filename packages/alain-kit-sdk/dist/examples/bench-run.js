import { ALAINKit } from '../index.js';
import fs from 'fs';
import path from 'path';
// Use provider root (no /v1); SDK appends /v1/chat/completions
const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const LMSTUDIO_BASE = process.env.LMSTUDIO_BASE_URL || 'http://localhost:1234';
const POE_KEY = process.env.POE_API_KEY || '';
const TARGETS = [
    { name: 'Ollama-20B', type: 'local', model: 'gpt-oss-20b', baseUrl: OLLAMA_BASE },
    { name: 'LMStudio-20B', type: 'local', model: 'gpt-oss-20b', baseUrl: LMSTUDIO_BASE },
    { name: 'Poe-GPT-5', type: 'poe', model: 'gpt-5', apiKey: POE_KEY },
    { name: 'Poe-GPT-OSS-20B', type: 'poe', model: 'gpt-oss-20b', apiKey: POE_KEY },
    { name: 'Poe-GPT-OSS-120B', type: 'poe', model: 'gpt-oss-120b', apiKey: POE_KEY },
    { name: 'Poe-GPT-OSS-120B-T', type: 'poe', model: 'gpt-oss-120b-t', apiKey: POE_KEY },
    { name: 'Poe-Claude-Opus-4.1', type: 'poe', model: 'claude-opus-4.1', apiKey: POE_KEY },
    { name: 'Poe-GPT-5-Chat', type: 'poe', model: 'gpt-5-chat', apiKey: POE_KEY },
    { name: 'Poe-Gemini-2.5-Pro', type: 'poe', model: 'gemini-2.5-pro', apiKey: POE_KEY }
];
const PROMPT = {
    title: 'Prompting GPT-OSS & Getting Started',
    description: 'A beginner-friendly guide to effective prompting with GPT-OSS models',
    difficulty: 'beginner',
    topics: [
        'What is GPT-OSS and why use it',
        'Basic prompt structure and formatting',
        'Getting started with your first prompts',
        'Common pitfalls and how to avoid them',
        'Best practices for beginners',
        'Interactive examples and exercises'
    ]
};
async function runOne(t, outRoot) {
    const kit = new ALAINKit({ baseUrl: t.baseUrl });
    const res = await kit.generateNotebook({
        modelReference: t.model,
        apiKey: t.apiKey || (t.type === 'local' ? 'local' : ''),
        difficulty: 'beginner',
        maxSections: 6,
        customPrompt: PROMPT
    });
    const dir = path.join(outRoot, t.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    fs.mkdirSync(dir, { recursive: true });
    if (res.notebook)
        fs.writeFileSync(path.join(dir, 'notebook.ipynb'), JSON.stringify(res.notebook, null, 2));
    fs.writeFileSync(path.join(dir, 'validation.md'), res.validationReport || '');
    fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify({
        target: t, success: res.success, quality: res.qualityScore, colab: res.colabCompatible,
        metrics: res.qualityMetrics, cells: res.notebook?.cells?.length ?? 0
    }, null, 2));
    return res.success;
}
(async () => {
    const outRoot = path.resolve(process.cwd(), '../bench');
    fs.mkdirSync(outRoot, { recursive: true });
    for (const t of TARGETS) {
        if (t.type === 'poe' && !t.apiKey) {
            console.log(`Skipping ${t.name} — POE_API_KEY not set`);
            continue;
        }
        try {
            console.log(`\n🚀 ${t.name} (${t.model}) using ${t.baseUrl || 'poe'}`);
            const ok = await runOne(t, outRoot);
            console.log(ok ? '✅ Completed' : '⚠️ Completed with issues');
        }
        catch (e) {
            console.error(`❌ ${t.name} failed:`, e?.message || e);
        }
        await new Promise(r => setTimeout(r, 1200));
    }
    console.log(`\n📦 Output written under: ${outRoot}`);
})();
//# sourceMappingURL=bench-run.js.map