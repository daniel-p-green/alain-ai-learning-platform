import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

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
  };
  collected_at: string;
  offline_cache?: {
    enabled: boolean;
    files_downloaded: number;
    bytes_downloaded: number;
    items?: Array<{ source: string; path: string; bytes: number }>;
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
  rootDir: string = process.cwd(),
  options?: { offlineCache?: boolean; githubToken?: string; maxBytes?: number; query?: string }
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
  const researchDir = join(rootDir, 'content', 'research', provider, model.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
  mkdirSync(researchDir, { recursive: true });
  
  // Fetch Hugging Face information
  const hfModelPath = `${provider}/${model}`;
  researchData.sources.huggingface = await fetchHuggingFaceInfo(hfModelPath);
  
  // Fetch OpenAI cookbook examples
  researchData.sources.openai_cookbook = await fetchOpenAICookbookExamples(model, options?.githubToken, options?.query);
  
  // Fetch Unsloth content
  researchData.sources.unsloth = await fetchUnslothContent(model, options?.githubToken, options?.query);
  
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
  
  console.log(`✅ Research completed and saved to: ${researchDir}`);
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
  
  return summary;
}
