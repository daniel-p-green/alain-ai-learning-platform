import { api, APIError } from "encore.dev/api";
import { secret } from "encore.dev/config";
import * as fs from "fs/promises";
import * as path from "path";
import { createHash } from "crypto";

// Storage configuration
const STORAGE_ROOT = process.env.ALAIN_STORAGE_ROOT || path.join(process.cwd(), "../data");

interface StorageMetadata {
  id: string;
  model_id: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  created_at: string;
  updated_at: string;
  file_type: "notebook" | "research" | "lesson";
  format: "json" | "ipynb" | "md";
  checksum: string;
  size_bytes: number;
  tags: string[];
}

interface DirectoryStructure {
  notebooks: {
    [model_id: string]: {
      [difficulty: string]: {
        [date: string]: string[];
      };
    };
  };
  research: {
    [model_id: string]: {
      cache: string[];
      analysis: string[];
      metadata: string[];
    };
  };
  exports: {
    [format: string]: {
      [model_id: string]: string[];
    };
  };
}

class FileSystemStorage {
  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private generateFileId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private sanitizeModelId(modelId: string): string {
    return modelId.replace(/[^a-zA-Z0-9-_]/g, '_').toLowerCase();
  }

  private formatTimestamp(): string {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  }

  async saveNotebook(
    modelId: string,
    difficulty: "beginner" | "intermediate" | "advanced",
    content: any,
    format: "json" | "ipynb" = "json"
  ): Promise<{ filePath: string; metadata: StorageMetadata }> {
    const sanitizedModelId = this.sanitizeModelId(modelId);
    const timestamp = this.formatTimestamp();
    const fileId = this.generateFileId();
    
    // Create directory structure: data/notebooks/{model_id}/{difficulty}/{date}/
    const notebookDir = path.join(
      STORAGE_ROOT,
      "notebooks",
      sanitizedModelId,
      difficulty,
      timestamp
    );
    
    await this.ensureDirectory(notebookDir);
    
    // Generate filename
    const filename = `${sanitizedModelId}_${difficulty}_${fileId}.${format}`;
    const filePath = path.join(notebookDir, filename);
    
    // Prepare content
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    // Create metadata
    const metadata: StorageMetadata = {
      id: fileId,
      model_id: modelId,
      difficulty,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file_type: "notebook",
      format,
      checksum: this.calculateChecksum(contentStr),
      size_bytes: Buffer.byteLength(contentStr, 'utf8'),
      tags: [modelId, difficulty, format]
    };
    
    // Save files
    await fs.writeFile(filePath, contentStr, 'utf8');
    await fs.writeFile(
      path.join(notebookDir, `${filename}.meta.json`),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
    
    return { filePath, metadata };
  }

  async saveResearch(
    modelId: string,
    researchData: any,
    type: "cache" | "analysis" | "metadata" = "analysis"
  ): Promise<{ filePath: string; metadata: StorageMetadata }> {
    const sanitizedModelId = this.sanitizeModelId(modelId);
    const timestamp = this.formatTimestamp();
    const fileId = this.generateFileId();
    
    // Create directory structure: data/research/{model_id}/{type}/
    const researchDir = path.join(
      STORAGE_ROOT,
      "research",
      sanitizedModelId,
      type
    );
    
    await this.ensureDirectory(researchDir);
    
    // Generate filename
    const filename = `${sanitizedModelId}_${type}_${timestamp}_${fileId}.json`;
    const filePath = path.join(researchDir, filename);
    
    // Prepare content
    const contentStr = typeof researchData === 'string' ? researchData : JSON.stringify(researchData, null, 2);
    
    // Create metadata
    const metadata: StorageMetadata = {
      id: fileId,
      model_id: modelId,
      difficulty: "intermediate", // Default for research
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      file_type: "research",
      format: "json",
      checksum: this.calculateChecksum(contentStr),
      size_bytes: Buffer.byteLength(contentStr, 'utf8'),
      tags: [modelId, type, "research"]
    };
    
    // Save files
    await fs.writeFile(filePath, contentStr, 'utf8');
    await fs.writeFile(
      path.join(researchDir, `${filename}.meta.json`),
      JSON.stringify(metadata, null, 2),
      'utf8'
    );
    
    return { filePath, metadata };
  }

  async listFiles(
    modelId?: string,
    fileType?: "notebook" | "research" | "lesson",
    difficulty?: string
  ): Promise<StorageMetadata[]> {
    const results: StorageMetadata[] = [];
    
    try {
      const baseDir = fileType ? path.join(STORAGE_ROOT, fileType === "notebook" ? "notebooks" : "research") : STORAGE_ROOT;
      
      const scanDirectory = async (dirPath: string) => {
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          
          for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            if (entry.isDirectory()) {
              await scanDirectory(fullPath);
            } else if (entry.name.endsWith('.meta.json')) {
              try {
                const metaContent = await fs.readFile(fullPath, 'utf8');
                const metadata: StorageMetadata = JSON.parse(metaContent);
                
                // Apply filters
                if (modelId && metadata.model_id !== modelId) continue;
                if (fileType && metadata.file_type !== fileType) continue;
                if (difficulty && metadata.difficulty !== difficulty) continue;
                
                results.push(metadata);
              } catch (error) {
                console.warn(`Failed to read metadata from ${fullPath}:`, error);
              }
            }
          }
        } catch (error) {
          // Directory doesn't exist or can't be read
        }
      };
      
      await scanDirectory(baseDir);
    } catch (error) {
      console.warn('Failed to list files:', error);
    }
    
    return results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getDirectoryStructure(): Promise<DirectoryStructure> {
    const structure: DirectoryStructure = {
      notebooks: {},
      research: {},
      exports: {}
    };
    
    try {
      // Scan notebooks
      const notebooksDir = path.join(STORAGE_ROOT, "notebooks");
      try {
        const modelDirs = await fs.readdir(notebooksDir);
        for (const modelId of modelDirs) {
          structure.notebooks[modelId] = {};
          const modelPath = path.join(notebooksDir, modelId);
          const difficultyDirs = await fs.readdir(modelPath);
          
          for (const difficulty of difficultyDirs) {
            structure.notebooks[modelId][difficulty] = {};
            const difficultyPath = path.join(modelPath, difficulty);
            const dateDirs = await fs.readdir(difficultyPath);
            
            for (const date of dateDirs) {
              const datePath = path.join(difficultyPath, date);
              const files = await fs.readdir(datePath);
              structure.notebooks[modelId][difficulty][date] = files.filter(f => !f.endsWith('.meta.json'));
            }
          }
        }
      } catch (error) {
        // Notebooks directory doesn't exist
      }
      
      // Scan research
      const researchDir = path.join(STORAGE_ROOT, "research");
      try {
        const modelDirs = await fs.readdir(researchDir);
        for (const modelId of modelDirs) {
          structure.research[modelId] = { cache: [], analysis: [], metadata: [] };
          const modelPath = path.join(researchDir, modelId);
          
          for (const type of ['cache', 'analysis', 'metadata']) {
            try {
              const typePath = path.join(modelPath, type);
              const files = await fs.readdir(typePath);
              structure.research[modelId][type as keyof typeof structure.research[string]] = 
                files.filter(f => !f.endsWith('.meta.json'));
            } catch (error) {
              // Type directory doesn't exist
            }
          }
        }
      } catch (error) {
        // Research directory doesn't exist
      }
    } catch (error) {
      console.warn('Failed to get directory structure:', error);
    }
    
    return structure;
  }
}

// Export singleton instance
export const fileSystemStorage = new FileSystemStorage();

// API endpoints
export const saveNotebookFile = api(
  { expose: true, method: "POST", path: "/storage/notebooks" },
  async (req: {
    modelId: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    content: any;
    format?: "json" | "ipynb";
  }): Promise<{ success: boolean; filePath?: string; metadata?: StorageMetadata; error?: string }> => {
    try {
      const result = await fileSystemStorage.saveNotebook(
        req.modelId,
        req.difficulty,
        req.content,
        req.format
      );
      
      return {
        success: true,
        filePath: result.filePath,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Failed to save notebook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

export const saveResearchFile = api(
  { expose: true, method: "POST", path: "/storage/research" },
  async (req: {
    modelId: string;
    researchData: any;
    type?: "cache" | "analysis" | "metadata";
  }): Promise<{ success: boolean; filePath?: string; metadata?: StorageMetadata; error?: string }> => {
    try {
      const result = await fileSystemStorage.saveResearch(
        req.modelId,
        req.researchData,
        req.type
      );
      
      return {
        success: true,
        filePath: result.filePath,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Failed to save research:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

export const listStoredFiles = api(
  { expose: true, method: "GET", path: "/storage/list" },
  async (req: {
    modelId?: string;
    fileType?: "notebook" | "research" | "lesson";
    difficulty?: string;
  }): Promise<{ success: boolean; files?: StorageMetadata[]; error?: string }> => {
    try {
      const files = await fileSystemStorage.listFiles(
        req.modelId,
        req.fileType,
        req.difficulty
      );
      
      return {
        success: true,
        files
      };
    } catch (error) {
      console.error('Failed to list files:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);

export const getStorageStructure = api(
  { expose: true, method: "GET", path: "/storage/structure" },
  async (): Promise<{ success: boolean; structure?: DirectoryStructure; error?: string }> => {
    try {
      const structure = await fileSystemStorage.getDirectoryStructure();
      
      return {
        success: true,
        structure
      };
    } catch (error) {
      console.error('Failed to get storage structure:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
);
