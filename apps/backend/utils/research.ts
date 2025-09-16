import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

const DEFAULT_REPO_ROOT = join(__dirname, '../../..');

export interface ResearchData {
  model: string;
  provider: string;
  sources: {
    huggingface?: {
      model_card?: string;
      repo_info?: any;
      files?: string[];
    };
    openai_cookbook?: {
      examples?: any[];
      notebooks?: string[];
    };
    unsloth?: {
      notebooks?: any[];
      examples?: string[];
    };
    kaggle?: {
      datasets?: any[];
      notebooks?: any[];
      competitions?: any[];
    };
  };
  collected_at: string;
  offline_cache?: {
    enabled: boolean;
    files_downloaded: number;
    bytes_downloaded: number;
    items?: Array<{ source: string; path: string; bytes: number }>;
  };
  // Optional richer, normalized summary for lesson design/develop phases
  summary_v2?: ResearchSummaryV2;
}

// Normalized research summary for lesson creation and offline readiness
export interface ResearchSummaryV2 {
  model_metadata: {
    id: string;
    org: string;
    license?: string;
    tags: string[];
    pipeline_tag?: string;
    card_last_modified?: string;
  };
  architecture: {
    parameters?: number; // absolute number (e.g., 20000000000)
    parameter_scale?: string; // e.g., "20B"
    layers?: number;
    hidden_size?: number;
    vocab_size?: number;
    context_length?: number;
    tokenizer?: {
      type?: string;
      model_max_length?: number;
      bos_token?: string;
      eos_token?: string;
    };
  };
  quantization: string[]; // hints from files/tags (e.g., int4, gguf, q8_0)
  capabilities: {
    tasks: string[]; // e.g., ["text-generation", "fill-mask"]
    reasoning?: boolean;
    coding?: boolean;
    multilingual?: boolean;
    fine_tuning?: boolean;
  };
  benchmarks?: Array<{ dataset: string; metric: string; value: number }>;
  usage_examples: {
    hf_snippet?: string;
    openai_compatible_snippet?: string;
  };
  compute: {
    vram_estimate_gb?: number;
    recommended_gpu?: string;
  };
  recommendations: {
    temperature?: number;
    top_p?: number;
  };
}

/**
 * Fetch Hugging Face model card and repository information
 */
async function fetchHuggingFaceInfo(modelPath: string): Promise<any> {
  try {
    console.log(`🔍 Fetching Hugging Face info for: ${modelPath}`);
    
    // Fetch model card (README.md)
    const modelCardUrl = `https://huggingface.co/${modelPath}/raw/main/README.md`;
    const modelCardResponse = await fetch(modelCardUrl);
    const modelCard = modelCardResponse.ok ? await modelCardResponse.text() : null;
    
    // Fetch repository info via API
    const apiUrl = `https://huggingface.co/api/models/${modelPath}`;
    const apiResponse = await fetch(apiUrl);
    const repoInfo = apiResponse.ok ? await apiResponse.json() : null;
    
    // Fetch file list (try recursive; fallback if needed)
    let filesUrl = `https://huggingface.co/api/models/${modelPath}/tree/main?recursive=1`;
    let filesResponse = await fetch(filesUrl);
    let files = filesResponse.ok ? await filesResponse.json() : [];
    if (!Array.isArray(files) || files.length === 0) {
      filesUrl = `https://huggingface.co/api/models/${modelPath}/tree/main`;
      filesResponse = await fetch(filesUrl);
      files = filesResponse.ok ? await filesResponse.json() : [];
    }
    
    return {
      model_card: modelCard,
      repo_info: repoInfo,
      files: files.map((f: any) => f.path).filter((path: string) => path)
    };
  } catch (error) {
    console.error('Error fetching Hugging Face info:', error);
    return null;
  }
}

// Try reading an HF JSON artifact, using local offline cache when available.
async function readHfJsonArtifact(
  hfModelPath: string,
  researchDir: string,
  filename: string,
  offlineOnly = false
): Promise<any | null> {
  // 1) Prefer local cache if exists
  try {
    const localPath = join(researchDir, 'hf-files', filename);
    if (existsSync(localPath)) {
      const txt = readFileSync(localPath, 'utf-8');
      try { return JSON.parse(txt); } catch { /* fallthrough */ }
    }
  } catch {}
  // 2) If offlineOnly, stop here
  if (offlineOnly) return null;
  // 3) Fetch from HF
  try {
    const url = `https://huggingface.co/${hfModelPath}/raw/main/${filename}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const txt = await resp.text();
    try { return JSON.parse(txt); } catch { return null; }
  } catch { return null; }
}

function toScale(n?: number): string | undefined {
  if (!n || !isFinite(n)) return undefined;
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n/1e9).toFixed(0)}B`;
  if (abs >= 1e6) return `${(n/1e6).toFixed(0)}M`;
  return String(n);
}

function deriveQuantization(tags: string[], fileList: string[]): string[] {
  const out = new Set<string>();
  const t = (tags || []).map(s => s.toLowerCase());
  const f = (fileList || []).map(s => s.toLowerCase());
  if (t.some(x => x.includes('int4') || x.includes('4bit'))) out.add('int4');
  if (t.some(x => x.includes('int8') || x.includes('8bit'))) out.add('int8');
  if (f.some(x => x.endsWith('.gguf') || x.includes('gguf'))) out.add('gguf');
  if (f.some(x => x.includes('q4_') || x.includes('q8_'))) {
    if (f.some(x => x.includes('q4_'))) out.add('q4');
    if (f.some(x => x.includes('q8_'))) out.add('q8');
  }
  return Array.from(out);
}

function estimateVramGB(paramCount?: number, precisionBytes = 2): number | undefined {
  if (!paramCount || !isFinite(paramCount)) return undefined;
  const bytes = paramCount * precisionBytes;
  const gb = bytes / (1024**3);
  return Math.ceil(gb * 10) / 10; // 1 decimal place
}

function extractFirstCodeBlock(md?: string): string | undefined {
  if (!md) return undefined;
  const m = md.match(/```[a-zA-Z0-9]*\n([\s\S]*?)\n```/);
  return m?.[1]?.trim();
}

function buildOpenAICompatSnippet(modelId: string): string {
  return [
    "from openai import OpenAI",
    "import os",
    "client = OpenAI(base_url=os.getenv('OPENAI_BASE_URL'), api_key=os.getenv('OPENAI_API_KEY'))",
    `resp = client.chat.completions.create(model=${JSON.stringify(modelId)}, messages=[{"role":"user","content":"Hello"}], max_tokens=64)`,
    "print(resp.choices[0].message.content)",
  ].join('\n');
}

async function buildResearchSummaryV2(
  researchDir: string,
  provider: string,
  model: string,
  hf: { model_card?: string; repo_info?: any; files?: string[] } | null
): Promise<ResearchSummaryV2> {
  const hfPath = `${provider}/${model}`;
  const offlineOnly = ((process.env.OFFLINE_MODE || '').toLowerCase() === '1' || (process.env.OFFLINE_MODE || '').toLowerCase() === 'true');

  const repo = hf?.repo_info || {};
  const tags: string[] = Array.isArray(repo?.tags) ? repo.tags : [];
  const pipelineTag: string | undefined = typeof repo?.pipeline_tag === 'string' ? repo.pipeline_tag : undefined;
  const siblings: any[] = Array.isArray(repo?.siblings) ? repo.siblings : [];
  const fileList: string[] = siblings.map((s: any) => s?.rfilename || s?.path || '').filter(Boolean);

  const cfg = await readHfJsonArtifact(hfPath, researchDir, 'config.json', offlineOnly);
  const genCfg = await readHfJsonArtifact(hfPath, researchDir, 'generation_config.json', offlineOnly);
  const tokCfg = await readHfJsonArtifact(hfPath, researchDir, 'tokenizer_config.json', offlineOnly);
  const tokMap = await readHfJsonArtifact(hfPath, researchDir, 'special_tokens_map.json', offlineOnly);

  const parameters = ((): number | undefined => {
    if (typeof repo?.downloads === 'number' && false) return undefined; // ignore
    const tagParam = (tags.find(t => /\d+\s*[mb]/i.test(t)) || '').toLowerCase();
    const m = tagParam.match(/(\d+(?:\.\d+)?)\s*([mb])/);
    if (m) {
      const num = parseFloat(m[1]);
      const scale = m[2] === 'b' ? 1e9 : 1e6;
      return Math.round(num * scale);
    }
    const cfgParams = cfg?.num_parameters || cfg?.num_params || cfg?.transformer?.params;
    if (typeof cfgParams === 'number') return cfgParams;
    return undefined;
  })();

  const parameter_scale = toScale(parameters);
  const layers = cfg?.num_hidden_layers || cfg?.n_layer || cfg?.num_layers;
  const hidden_size = cfg?.hidden_size || cfg?.n_embd || cfg?.d_model;
  const vocab_size = cfg?.vocab_size;
  const context_length = cfg?.max_position_embeddings || cfg?.seq_length || genCfg?.max_length || tokCfg?.model_max_length;

  const quant = deriveQuantization(tags, fileList);

  const tasks = [pipelineTag, ...(tags || []).filter(Boolean)].filter(Boolean) as string[];
  const lcCard = (hf?.model_card || '').toLowerCase();
  const capabilities = {
    tasks: Array.from(new Set(tasks)),
    reasoning: /reasoning|math|gsm8k|mmlu/.test(lcCard),
    coding: /code|programming|coding|python/.test(lcCard),
    multilingual: /multilingual|translation|languages?/.test(lcCard),
    fine_tuning: /fine[- ]?tuning|qlora|lora/.test(lcCard),
  };

  // Benchmarks: try to parse lightweight hints from README text
  const benchmarks: Array<{ dataset: string; metric: string; value: number }> = [];
  try {
    const re = /(mmlu|gsm8k|hellaswag|arc|truthfulqa)\s*[:=]\s*(\d+(?:\.\d+)?)\s*%/ig;
    let m: RegExpExecArray | null;
    const src = hf?.model_card || '';
    while ((m = re.exec(src)) !== null) {
      const ds = (m[1] || '').toUpperCase();
      const val = parseFloat(m[2]);
      if (isFinite(val)) benchmarks.push({ dataset: ds, metric: 'accuracy', value: val });
    }
  } catch {}

  // Usage examples
  const hf_snippet = extractFirstCodeBlock(hf?.model_card || undefined);
  const openai_compatible_snippet = buildOpenAICompatSnippet(model.toLowerCase());

  const vram_estimate_gb = estimateVramGB(parameters, 2);
  const recommended_gpu = vram_estimate_gb ? (vram_estimate_gb > 24 ? 'A100/MI300 (80GB)' : vram_estimate_gb > 16 ? 'A6000/4090 (24GB)' : 'Consumer 8–16GB') : undefined;

  const recs = {
    temperature: typeof genCfg?.temperature === 'number' ? genCfg.temperature : 0.3,
    top_p: typeof genCfg?.top_p === 'number' ? genCfg.top_p : 0.9,
  };

  return {
    model_metadata: {
      id: model,
      org: provider,
      license: repo?.license ?? (repo?.cardData?.license || undefined),
      tags: tags,
      pipeline_tag: pipelineTag,
      card_last_modified: repo?.lastModified || undefined,
    },
    architecture: {
      parameters,
      parameter_scale: parameter_scale,
      layers: typeof layers === 'number' ? layers : undefined,
      hidden_size: typeof hidden_size === 'number' ? hidden_size : undefined,
      vocab_size: typeof vocab_size === 'number' ? vocab_size : undefined,
      context_length: typeof context_length === 'number' ? context_length : undefined,
      tokenizer: {
        type: tokCfg?.tokenizer_class || tokCfg?._name_or_path,
        model_max_length: tokCfg?.model_max_length,
        bos_token: tokMap?.bos_token || undefined,
        eos_token: tokMap?.eos_token || undefined,
      },
    },
    quantization: quant,
    capabilities,
    benchmarks: benchmarks.length ? benchmarks : undefined,
    usage_examples: { hf_snippet, openai_compatible_snippet },
    compute: { vram_estimate_gb, recommended_gpu },
    recommendations: recs,
  };
}

/**
 * Search OpenAI cookbook for relevant examples
 */
async function fetchOpenAICookbookExamples(modelName: string, githubToken?: string, extraQuery?: string): Promise<any> {
  try {
    console.log(`📚 Searching OpenAI cookbook for: ${modelName}`);
    
    // Search GitHub API for cookbook repositories
    const searchUrl = `https://api.github.com/search/repositories?q=openai+cookbook+${encodeURIComponent(modelName)}`;
    const searchResponse = await fetch(searchUrl, { headers: githubHeaders(githubToken) });
    const searchResults = searchResponse.ok ? await searchResponse.json() : null;
    
    // Also search for general OpenAI cookbook
    const cookbookUrl = 'https://api.github.com/repos/openai/openai-cookbook';
    const cookbookResponse = await fetch(cookbookUrl, { headers: githubHeaders(githubToken) });
    const cookbookInfo = cookbookResponse.ok ? await cookbookResponse.json() : null;
    
    // Search code in cookbook for model mentions (paths only)
    const cookedQ = [
      `repo:openai/openai-cookbook ${modelName}`,
      `repo:openai/openai-cookbook gpt-oss`,
      extraQuery ? `repo:openai/openai-cookbook ${extraQuery}` : ''
    ].filter(Boolean).join(' OR ');
    const codeSearchUrl = `https://api.github.com/search/code?q=${encodeURIComponent(cookedQ)}`;
    const codeSearchResponse = await fetch(codeSearchUrl, { headers: githubHeaders(githubToken) });
    const codeResults = codeSearchResponse.ok ? await codeSearchResponse.json() : { items: [] };
    const notebooks = (codeResults.items || [])
      .filter((it: any) => typeof it?.path === 'string')
      .map((it: any) => it.path);
    
    return {
      examples: searchResults?.items || [],
      notebooks,
      cookbook_info: cookbookInfo
    };
  } catch (error) {
    console.error('Error fetching OpenAI cookbook:', error);
    return null;
  }
}

/**
 * Search Kaggle for datasets, notebooks, and competitions
 */
async function fetchKaggleContent(modelName: string, creds?: { username?: string; key?: string }, extraQuery?: string): Promise<any> {
  try {
    const username = (creds?.username || process.env.KAGGLE_USERNAME || '').trim();
    const key = (creds?.key || process.env.KAGGLE_KEY || '').trim();
    if (!username || !key) return null;
    const auth = 'Basic ' + Buffer.from(`${username}:${key}`).toString('base64');
    const headers = { 'Authorization': auth, 'User-Agent': 'ALAIN-Research/1.0' } as Record<string, string>;
    const base = 'https://www.kaggle.com/api/v1';
    const q = [modelName, extraQuery].filter(Boolean).join(' ');

    const toJson = async (url: string) => {
      const r = await fetch(url, { headers });
      if (!r.ok) return [];
      try { return await r.json(); } catch { return []; }
    };

    console.log(`🏆 Querying Kaggle API for: ${q}`);
    const datasets = await toJson(`${base}/datasets/list?search=${encodeURIComponent(q)}&page=1&pageSize=20`);
    const notebooks = await toJson(`${base}/kernels/list?search=${encodeURIComponent(q)}&page=1&pageSize=20`);
    const competitions = await toJson(`${base}/competitions/list?search=${encodeURIComponent(q)}&page=1&pageSize=20`);
    return { datasets, notebooks, competitions };
  } catch (error) {
    console.error('Error fetching Kaggle content:', error);
    return null;
  }
}

/**
 * Search for Unsloth notebooks and examples
 */
async function fetchUnslothContent(modelName: string, githubToken?: string, extraQuery?: string): Promise<any> {
  try {
    console.log(`🦥 Searching Unsloth content for: ${modelName}`);
    
    // Search GitHub for Unsloth repositories
    const searchUrl = `https://api.github.com/search/repositories?q=unsloth+${encodeURIComponent(modelName)}+notebook`;
    const searchResponse = await fetch(searchUrl, { headers: githubHeaders(githubToken) });
    const searchResults = searchResponse.ok ? await searchResponse.json() : null;
    
    // Search for Unsloth main repository
    const unslothUrl = 'https://api.github.com/repos/unslothai/unsloth';
    const unslothResponse = await fetch(unslothUrl, { headers: githubHeaders(githubToken) });
    const unslothInfo = unslothResponse.ok ? await unslothResponse.json() : null;
    
    // Organization-wide code search for notebooks referencing the model
    const orgQ = `org:unslothai ${modelName} extension:ipynb`;
    const broaderQ = `unsloth ${modelName} extension:ipynb`;
    const extraQ = extraQuery ? `${extraQuery} extension:ipynb` : '';
    const codeSearchUrl = `https://api.github.com/search/code?q=${encodeURIComponent([orgQ, broaderQ, extraQ].filter(Boolean).join(' OR '))}`;
    const codeSearchResp = await fetch(codeSearchUrl, { headers: githubHeaders(githubToken) });
    const codeSearch = codeSearchResp.ok ? await codeSearchResp.json() : { items: [] };
    
    return {
      notebooks: searchResults?.items || [],
      examples: (codeSearch.items || []).map((it: any) => ({
        repository: it?.repository?.full_name,
        path: it?.path,
        html_url: it?.html_url,
        url: it?.url,
      })),
      unsloth_info: unslothInfo
    };
  } catch (error) {
    console.error('Error fetching Unsloth content:', error);
    return null;
  }
}

// Helper: GitHub headers with optional token
function githubHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'ALAIN-Research/1.0'
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// Helper: ensure parent directory exists
function ensureDir(filePath: string) {
  try { mkdirSync(dirname(filePath), { recursive: true }); } catch {}
}

// Download a small file with size cap
async function downloadCapped(url: string, destPath: string, maxBytes = 5 * 1024 * 1024, headers?: Record<string, string>): Promise<number> {
  const resp = await fetch(url, { headers });
  if (!resp.ok) return 0;
  const ab = await resp.arrayBuffer();
  if (ab.byteLength > maxBytes) return 0;
  ensureDir(destPath);
  writeFileSync(destPath, Buffer.from(ab));
  return ab.byteLength;
}

// Resolve a GitHub content download URL from repo + path
async function resolveGithubDownloadUrl(repoFullName: string, filePath: string, ref?: string, token?: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${repoFullName}/contents/${encodeURIComponent(filePath)}${ref ? `?ref=${encodeURIComponent(ref)}` : ''}`;
  const resp = await fetch(url, { headers: githubHeaders(token) });
  if (!resp.ok) return null;
  const data: any = await resp.json();
  return data?.download_url || null;
}

/**
 * Comprehensive research function for a model
 */
export async function researchModel(
  model: string,
  provider: string = 'openai',
  rootDir: string = DEFAULT_REPO_ROOT,
  options?: { offlineCache?: boolean; githubToken?: string; maxBytes?: number; query?: string; kaggle?: { username?: string; key?: string } }
): Promise<string> {
  console.log(`🔬 Starting comprehensive research for: ${model}`);
  
  const researchData: ResearchData = {
    model,
    provider,
    sources: {},
    collected_at: new Date().toISOString(),
    offline_cache: {
      enabled: !!options?.offlineCache,
      files_downloaded: 0,
      bytes_downloaded: 0,
      items: []
    }
  };
  
  // Create research directory
  const researchDir = join(rootDir, 'resources', 'content', 'research', provider, model.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  mkdirSync(researchDir, { recursive: true });
  
  // Fetch Hugging Face information
  const hfModelPath = `${provider}/${model}`;
  researchData.sources.huggingface = await fetchHuggingFaceInfo(hfModelPath);
  
  // Fetch OpenAI cookbook examples
  researchData.sources.openai_cookbook = await fetchOpenAICookbookExamples(model, options?.githubToken, options?.query);
  
  // Fetch Unsloth content
  researchData.sources.unsloth = await fetchUnslothContent(model, options?.githubToken, options?.query);
  
  // Fetch Kaggle content (if credentials are provided)
  try {
    const kaggle = await fetchKaggleContent(model, options?.kaggle, options?.query);
    if (kaggle) researchData.sources.kaggle = kaggle;
  } catch {}
  
  // Optional offline caching of relevant files for later offline use
  if (options?.offlineCache) {
    const cap = options?.maxBytes ?? 5 * 1024 * 1024; // 5MB per file
    const hfFiles = researchData.sources.huggingface?.files || [];
    const allowExt = new Set(['.md', '.json', '.yaml', '.yml', '.txt', '.py', '.ipynb']);
    const endsWithAny = (name: string, exts: Set<string>) => {
      const lower = name.toLowerCase();
      for (const e of exts) if (lower.endsWith(e)) return true;
      return false;
    };
    // Download HF files (text/code only)
    for (const p of hfFiles) {
      if (!p || !endsWithAny(p, allowExt)) continue;
      const url = `https://huggingface.co/${hfModelPath}/resolve/main/${p}`;
      const dest = join(researchDir, 'hf-files', p);
      try {
        const bytes = await downloadCapped(url, dest, cap);
        if (bytes > 0) {
          researchData.offline_cache!.files_downloaded++;
          researchData.offline_cache!.bytes_downloaded += bytes;
          researchData.offline_cache!.items!.push({ source: 'huggingface', path: `hf-files/${p}`, bytes });
        }
      } catch {}
    }
    // Download Unsloth notebooks from code search
    const unslothItems = researchData.sources.unsloth?.examples || [];
    for (const it of unslothItems) {
      const repo = it?.repository; const path = it?.path;
      if (!repo || !path) continue;
      try {
        const dl = await resolveGithubDownloadUrl(repo, path, undefined, options?.githubToken);
        if (!dl) continue;
        const dest = join(researchDir, 'unsloth', repo.replace('/', '__'), path);
        const bytes = await downloadCapped(dl, dest, cap, githubHeaders(options?.githubToken));
        if (bytes > 0) {
          researchData.offline_cache!.files_downloaded++;
          researchData.offline_cache!.bytes_downloaded += bytes;
          researchData.offline_cache!.items!.push({ source: 'unsloth', path: `unsloth/${repo.replace('/', '__')}/${path}`, bytes });
        }
      } catch {}
    }
    // Download matched OpenAI cookbook files
    const ckPaths = researchData.sources.openai_cookbook?.notebooks || [];
    for (const p of ckPaths) {
      try {
        const dl = await resolveGithubDownloadUrl('openai/openai-cookbook', p, undefined, options?.githubToken);
        if (!dl) continue;
        const dest = join(researchDir, 'cookbook', p);
        const bytes = await downloadCapped(dl, dest, cap, githubHeaders(options?.githubToken));
        if (bytes > 0) {
          researchData.offline_cache!.files_downloaded++;
          researchData.offline_cache!.bytes_downloaded += bytes;
          researchData.offline_cache!.items!.push({ source: 'openai-cookbook', path: `cookbook/${p}`, bytes });
        }
      } catch {}
    }
  }
  
  // Save research data
  const researchFile = join(researchDir, 'research-data.json');
  writeFileSync(researchFile, JSON.stringify(researchData, null, 2));

  // Build Research Summary V2 (normalized) and write sidecar files
  try {
    const v2 = await buildResearchSummaryV2(researchDir, provider, model, researchData.sources.huggingface || null);
    researchData.summary_v2 = v2;
    const v2File = join(researchDir, 'research-summary.v2.json');
    writeFileSync(v2File, JSON.stringify(v2, null, 2));
    // Additional markdowns for quick human read
    const cfgMd = [
      '# Model Configuration',
      '',
      v2.architecture.parameter_scale ? `- Parameters: ${v2.architecture.parameter_scale}` : '',
      typeof v2.architecture.layers === 'number' ? `- Layers: ${v2.architecture.layers}` : '',
      typeof v2.architecture.hidden_size === 'number' ? `- Hidden size: ${v2.architecture.hidden_size}` : '',
      typeof v2.architecture.vocab_size === 'number' ? `- Vocab size: ${v2.architecture.vocab_size}` : '',
      typeof v2.architecture.context_length === 'number' ? `- Context length: ${v2.architecture.context_length}` : '',
      v2.quantization.length ? `- Quantization: ${v2.quantization.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    writeFileSync(join(researchDir, 'configs.md'), cfgMd + '\n');
    if (v2.benchmarks && v2.benchmarks.length) {
      const b = ['# Benchmarks', '', ...v2.benchmarks.map(x => `- ${x.dataset}: ${x.metric} = ${x.value}`)].join('\n');
      writeFileSync(join(researchDir, 'benchmarks.md'), b + '\n');
    }
    const usageLines = ['# Usage Examples', ''];
    if (v2.usage_examples.hf_snippet) {
      usageLines.push('## Transformers');
      usageLines.push('```python');
      usageLines.push(v2.usage_examples.hf_snippet);
      usageLines.push('```');
    }
    usageLines.push('## OpenAI-compatible');
    usageLines.push('```python');
    usageLines.push(v2.usage_examples.openai_compatible_snippet || buildOpenAICompatSnippet(model));
    usageLines.push('```');
    writeFileSync(join(researchDir, 'usage-examples.md'), usageLines.join('\n') + '\n');
  } catch (e) {
    // Non-fatal
  }
  
  // Save individual files in appropriate formats
  if (researchData.sources.huggingface?.model_card) {
    const modelCardFile = join(researchDir, 'model-card.md');
    writeFileSync(modelCardFile, researchData.sources.huggingface.model_card);
  }
  
  if (researchData.sources.huggingface?.repo_info) {
    const repoInfoFile = join(researchDir, 'huggingface-info.md');
    writeFileSync(repoInfoFile, formatHuggingFaceInfo(researchData.sources.huggingface.repo_info));
  }
  if (researchData.sources.openai_cookbook) {
    const cookbookFile = join(researchDir, 'openai-cookbook.md');
    writeFileSync(cookbookFile, formatOpenAICookbook(researchData.sources.openai_cookbook));
  }
  if (researchData.sources.unsloth) {
    const unslothFile = join(researchDir, 'unsloth-content.md');
    writeFileSync(unslothFile, formatUnslothContent(researchData.sources.unsloth));
  }
  if (researchData.sources.kaggle) {
    const kaggleFile = join(researchDir, 'kaggle-content.md');
    writeFileSync(kaggleFile, formatKaggleContent(researchData.sources.kaggle));
  }
  
  console.log(`✅ Research completed and saved to: ${researchDir}`);
  // Optional: index research directory in DB for discovery
  try {
    if ((process.env.CATALOG_INDEX || '').toLowerCase() === '1') {
      const { upsertResearchIndex } = await import('../catalog/store');
      const stats = {
        hf_files: researchData.sources.huggingface?.files?.length || 0,
        cookbook_examples: researchData.sources.openai_cookbook?.examples?.length || 0,
        cookbook_notebooks: researchData.sources.openai_cookbook?.notebooks?.length || 0,
        unsloth_notebooks: researchData.sources.unsloth?.notebooks?.length || 0,
        unsloth_examples: researchData.sources.unsloth?.examples?.length || 0,
        offline: researchData.offline_cache || null,
      };
      await upsertResearchIndex({
        model,
        provider,
        research_dir: researchDir,
        collected_at: researchData.collected_at,
        stats,
      });
    }
  } catch {}
  return researchDir;
}

/**
 * Format Hugging Face info as readable Markdown
 */
function formatHuggingFaceInfo(repoInfo: any): string {
  if (!repoInfo) return '# Hugging Face Repository Info\n\nNo data available.\n';
  
  let md = `# Hugging Face Repository Info\n\n`;
  md += `**Model ID:** ${repoInfo.id || 'N/A'}\n`;
  md += `**Pipeline:** ${repoInfo.pipeline_tag || 'N/A'}\n`;
  md += `**Library:** ${repoInfo.library_name || 'N/A'}\n`;
  md += `**Private:** ${repoInfo.private ? 'Yes' : 'No'}\n\n`;
  
  if (repoInfo.tags && repoInfo.tags.length > 0) {
    md += `## Tags\n`;
    repoInfo.tags.forEach((tag: string) => {
      md += `- ${tag}\n`;
    });
    md += `\n`;
  }
  
  if (repoInfo.downloads) {
    md += `**Downloads:** ${repoInfo.downloads.toLocaleString()}\n`;
  }
  
  if (repoInfo.likes) {
    md += `**Likes:** ${repoInfo.likes.toLocaleString()}\n`;
  }
  
  return md;
}

/**
 * Format OpenAI Cookbook data as readable Markdown
 */
function formatOpenAICookbook(cookbookData: any): string {
  if (!cookbookData) return '# OpenAI Cookbook Resources\n\nNo data available.\n';
  
  let md = `# OpenAI Cookbook Resources\n\n`;
  
  if (cookbookData.examples && cookbookData.examples.length > 0) {
    md += `## Related Repositories\n\n`;
    cookbookData.examples.forEach((repo: any) => {
      md += `### [${repo.name}](${repo.html_url})\n`;
      md += `**Owner:** ${repo.owner?.login || 'N/A'}\n`;
      md += `**Description:** ${repo.description || 'No description'}\n`;
      md += `**Stars:** ${repo.stargazers_count || 0}\n`;
      md += `**Language:** ${repo.language || 'N/A'}\n\n`;
    });
  }
  
  if (cookbookData.notebooks && cookbookData.notebooks.length > 0) {
    md += `## Cookbook Files\n\n`;
    cookbookData.notebooks.forEach((file: any) => {
      md += `- [${file.name}](${file.html_url || file.download_url})\n`;
    });
    md += `\n`;
  }
  
  return md;
}

/**
 * Format Unsloth content as readable Markdown
 */
function formatUnslothContent(unslothData: any): string {
  if (!unslothData) return '# Unsloth Resources\n\nNo data available.\n';
  
  let md = `# Unsloth Resources\n\n`;
  
  if (unslothData.notebooks && unslothData.notebooks.length > 0) {
    md += `## Related Repositories\n\n`;
    unslothData.notebooks.forEach((repo: any) => {
      md += `### [${repo.name}](${repo.html_url})\n`;
      md += `**Owner:** ${repo.owner?.login || 'N/A'}\n`;
      md += `**Description:** ${repo.description || 'No description'}\n`;
      md += `**Stars:** ${repo.stargazers_count || 0}\n`;
      md += `**Language:** ${repo.language || 'N/A'}\n\n`;
    });
  }
  
  if (unslothData.examples && unslothData.examples.length > 0) {
    md += `## Example Notebooks\n\n`;
    unslothData.examples.forEach((file: any) => {
      md += `- [${file.name}](${file.html_url || file.download_url})\n`;
    });
    md += `\n`;
  }
  
  if (unslothData.unsloth_info) {
    md += `## Unsloth Repository Info\n\n`;
    md += `**Description:** ${unslothData.unsloth_info.description || 'N/A'}\n`;
    md += `**Stars:** ${unslothData.unsloth_info.stargazers_count || 0}\n`;
    md += `**Language:** ${unslothData.unsloth_info.language || 'N/A'}\n\n`;
  }
  
  return md;
}

/**
 * Format Kaggle content as readable Markdown
 */
function formatKaggleContent(kaggleData: any): string {
  if (!kaggleData) return '# Kaggle Resources\n\nNo data available.\n';
  
  let md = `# Kaggle Resources\n\n`;
  
  if (Array.isArray(kaggleData.datasets) && kaggleData.datasets.length > 0) {
    md += `## Datasets\n\n`;
    kaggleData.datasets.slice(0, 20).forEach((d: any) => {
      const title = d?.title || d?.ref || d?.datasetSlug || 'Dataset';
      const owner = d?.ownerName || d?.ownerRef || '';
      const url = d?.url || (owner && d?.datasetSlug ? `https://www.kaggle.com/datasets/${owner}/${d.datasetSlug}` : '');
      md += `- [${title}](${url || '#'})\n`;
    });
    md += `\n`;
  }
  if (Array.isArray(kaggleData.notebooks) && kaggleData.notebooks.length > 0) {
    md += `## Notebooks\n\n`;
    kaggleData.notebooks.slice(0, 20).forEach((k: any) => {
      const title = k?.title || k?.scriptTitle || 'Notebook';
      const author = k?.authorName || k?.authorRef || '';
      const slug = k?.slug || k?.scriptSlug || '';
      const url = author && slug ? `https://www.kaggle.com/code/${author}/${slug}` : '';
      md += `- [${title}](${url || '#'})\n`;
    });
    md += `\n`;
  }
  if (Array.isArray(kaggleData.competitions) && kaggleData.competitions.length > 0) {
    md += `## Competitions\n\n`;
    kaggleData.competitions.slice(0, 20).forEach((c: any) => {
      const title = c?.title || c?.competitionTitle || 'Competition';
      const ref = c?.competitionId || c?.ref || c?.slug || '';
      const url = ref ? `https://www.kaggle.com/competitions/${ref}` : '';
      md += `- [${title}](${url || '#'})\n`;
    });
    md += `\n`;
  }
  
  return md;
}

/**
 * Generate research summary
 */
export function generateResearchSummary(researchDir: string): string {
  const researchFile = join(researchDir, 'research-data.json');
  if (!existsSync(researchFile)) {
    return 'No research data found';
  }
  
  const data: ResearchData = JSON.parse(readFileSync(researchFile, 'utf-8'));
  
  let summary = `# Research Summary: ${data.model}\n\n`;
  summary += `**Provider:** ${data.provider}\n`;
  summary += `**Collected:** ${data.collected_at}\n\n`;
  
  if (data.sources.huggingface) {
    summary += `## Hugging Face\n`;
    summary += `- Model card: ${data.sources.huggingface.model_card ? '✅ Available' : '❌ Not found'}\n`;
    summary += `- Repository info: ${data.sources.huggingface.repo_info ? '✅ Available' : '❌ Not found'}\n`;
    summary += `- Files: ${data.sources.huggingface.files?.length || 0} files found\n\n`;
  }
  
  if (data.sources.openai_cookbook) {
    summary += `## OpenAI Cookbook\n`;
    summary += `- Examples: ${data.sources.openai_cookbook.examples?.length || 0} repositories found\n`;
    summary += `- Notebooks: ${data.sources.openai_cookbook.notebooks?.length || 0} files found\n\n`;
  }
  
  if (data.sources.unsloth) {
    summary += `## Unsloth\n`;
    summary += `- Notebooks: ${data.sources.unsloth.notebooks?.length || 0} repositories found\n`;
    summary += `- Examples: ${data.sources.unsloth.examples?.length || 0} files found\n\n`;
  }
  
  if (data.sources.kaggle) {
    summary += `## Kaggle\n`;
    summary += `- Datasets: ${data.sources.kaggle.datasets?.length || 0}\n`;
    summary += `- Notebooks: ${data.sources.kaggle.notebooks?.length || 0}\n`;
    summary += `- Competitions: ${data.sources.kaggle.competitions?.length || 0}\n\n`;
  }
  // If V2 is present, append compact architecture/capabilities digest
  try {
    const v2File = join(researchDir, 'research-summary.v2.json');
    if (existsSync(v2File)) {
      const v2 = JSON.parse(readFileSync(v2File, 'utf-8')) as ResearchSummaryV2;
      summary += `## Core Specs\n`;
      if (v2.architecture.parameter_scale) summary += `- Parameters: ${v2.architecture.parameter_scale}\n`;
      if (typeof v2.architecture.context_length === 'number') summary += `- Context length: ${v2.architecture.context_length}\n`;
      if (v2.quantization?.length) summary += `- Quantization: ${v2.quantization.join(', ')}\n`;
      if (v2.capabilities?.tasks?.length) summary += `- Tasks: ${v2.capabilities.tasks.slice(0, 6).join(', ')}\n`;
      if (v2.benchmarks?.length) summary += `- Benchmarks: ${v2.benchmarks.slice(0,3).map(b => `${b.dataset} ${b.value}`).join('; ')}\n`;
      summary += `\n`;
    }
  } catch {}
  
  return summary;
}
