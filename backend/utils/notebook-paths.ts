import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

export interface ModelMaker {
  name: string;
  org_type: string;
  homepage?: string | null;
  license?: string | null;
  repo?: string | null;
}

export interface NotebookMetadata {
  filename: string;
  title: string;
  difficulty: string;
  created: string;
  tags: string[];
}

export interface ModelMetadata {
  model_name: string;
  provider: string;
  model_maker: ModelMaker;
  notebooks: NotebookMetadata[];
}

/**
 * Map model names to provider directories
 */
function getProviderFromModel(model: string, maker?: ModelMaker): string {
  const modelLower = model.toLowerCase();
  
  // Check maker first if available
  if (maker?.name) {
    const makerLower = maker.name.toLowerCase();
    if (makerLower.includes('openai')) return 'openai';
    if (makerLower.includes('anthropic')) return 'anthropic';
    if (makerLower.includes('meta')) return 'meta';
    if (makerLower.includes('google')) return 'google';
    if (makerLower.includes('microsoft')) return 'microsoft';
    if (makerLower.includes('mistral')) return 'mistral';
  }
  
  // Fallback to model name patterns
  if (modelLower.includes('gpt') || modelLower.includes('openai')) return 'openai';
  if (modelLower.includes('claude') || modelLower.includes('anthropic')) return 'anthropic';
  if (modelLower.includes('llama') || modelLower.includes('meta')) return 'meta';
  if (modelLower.includes('gemini') || modelLower.includes('palm') || modelLower.includes('bard')) return 'google';
  if (modelLower.includes('phi') || modelLower.includes('orca')) return 'microsoft';
  if (modelLower.includes('mistral') || modelLower.includes('mixtral')) return 'mistral';
  if (modelLower.includes('huggingface') || modelLower.includes('transformers')) return 'huggingface';
  
  return 'other';
}

/**
 * Generate organized path for notebook storage
 */
export function getNotebookPath(
  model: string,
  title: string,
  maker?: ModelMaker,
  rootDir: string = process.cwd()
): { dir: string; filename: string; fullPath: string } {
  const provider = getProviderFromModel(model, maker);
  const modelDir = model.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const filename = `${title.toLowerCase().replace(/[^a-z0-9-]/g, '-')}.ipynb`;
  
  const dir = join(rootDir, 'content', 'notebooks', provider, modelDir);
  const fullPath = join(dir, filename);
  
  return { dir, filename, fullPath };
}

/**
 * Save notebook with organized directory structure
 */
export function saveNotebookWithMetadata(
  notebook: any,
  meta: {
    model: string;
    title: string;
    difficulty: string;
    tags?: string[];
  },
  maker?: ModelMaker,
  rootDir: string = process.cwd()
): string {
  const { dir, filename, fullPath } = getNotebookPath(meta.model, meta.title, maker, rootDir);
  
  // Ensure directory exists
  mkdirSync(dir, { recursive: true });
  
  // Save notebook
  writeFileSync(fullPath, JSON.stringify(notebook, null, 2));
  
  // Update metadata
  updateModelMetadata(dir, meta, maker, filename);
  
  return fullPath;
}

/**
 * Update or create metadata.json for a model directory
 */
function updateModelMetadata(
  modelDir: string,
  meta: { model: string; title: string; difficulty: string; tags?: string[] },
  maker?: ModelMaker,
  filename?: string
): void {
  const metadataPath = join(modelDir, 'metadata.json');
  const provider = getProviderFromModel(meta.model, maker);
  
  let metadata: ModelMetadata;
  
  if (existsSync(metadataPath)) {
    metadata = JSON.parse(readFileSync(metadataPath, 'utf-8'));
  } else {
    metadata = {
      model_name: meta.model,
      provider,
      model_maker: maker || {
        name: 'Unknown',
        org_type: 'unknown'
      },
      notebooks: []
    };
  }
  
  // Add or update notebook entry
  if (filename) {
    const existingIndex = metadata.notebooks.findIndex(nb => nb.filename === filename);
    const notebookMeta: NotebookMetadata = {
      filename,
      title: meta.title,
      difficulty: meta.difficulty,
      created: new Date().toISOString().split('T')[0],
      tags: meta.tags || []
    };
    
    if (existingIndex >= 0) {
      metadata.notebooks[existingIndex] = notebookMeta;
    } else {
      metadata.notebooks.push(notebookMeta);
    }
  }
  
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}
