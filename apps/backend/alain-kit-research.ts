import { PoeClient } from './execution/providers/poe';
import { readFile } from 'fs/promises';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

interface ResearchFindings {
  modelName: string;
  modelCard: any;
  researchDepth: string;
  keyFindings: string[];
  technicalSpecs: any;
  useCases: string[];
  limitations: string[];
  learningObjectives: string[];
  learningPath: any[];
  educationalContext: any;
  qualityScore: number;
  timestamp: string;
}

export class AlainKitResearch {
  private poeClient: PoeClient;
  private researchPrompt: string = '';

  constructor() {
    this.poeClient = new PoeClient();
    this.loadResearchPrompt();
  }

  private async loadResearchPrompt() {
    try {
      this.researchPrompt = await readFile(
        path.join(__dirname, '../../resources/prompts/alain-kit/research.harmony.txt'), 
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to load research prompt:', error);
      throw new Error('Could not load ALAIN-Kit research prompt');
    }
  }

  /**
   * Extract model name from Hugging Face URL
   */
  private extractModelName(hfUrl: string): string {
    const match = hfUrl.match(/huggingface\.co\/([^\/]+\/[^\/\?#]+)/);
    if (!match) {
      throw new Error('Invalid Hugging Face URL format');
    }
    return match[1];
  }

  /**
   * Fetch model card data from Hugging Face API
   */
  private async fetchModelCard(modelName: string): Promise<any> {
    try {
      const response = await fetch(`https://huggingface.co/api/models/${modelName}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch model data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching model card:', error);
      return null;
    }
  }

  /**
   * Run ALAIN-Kit research phase on a Hugging Face model
   */
  async runResearch(hfUrl: string, topic?: string): Promise<ResearchFindings> {
    console.log(`🔍 Starting ALAIN-Kit research for: ${hfUrl}`);
    
    // Extract model name from URL
    const modelName = this.extractModelName(hfUrl);
    console.log(`📋 Model: ${modelName}`);

    // Fetch model card data
    const modelCard = await this.fetchModelCard(modelName);
    if (!modelCard) {
      throw new Error('Could not fetch model card data');
    }

    // Prepare research context
    const researchTopic = topic || `Understanding ${modelName} architecture, capabilities, and applications`;
    
    // Build the research prompt with model context
    const researchContext = `
MODEL TO RESEARCH: ${modelName}
HUGGING FACE URL: ${hfUrl}
RESEARCH TOPIC: ${researchTopic}

MODEL CARD DATA:
${JSON.stringify(modelCard, null, 2)}

RESEARCH INSTRUCTIONS:
${this.researchPrompt}
`;

    console.log('🤖 Sending research request to GPT-OSS-20B...');

    try {
      // Send to GPT-OSS-20B via Poe
      const response = await this.poeClient.sendMessage(
        researchContext,
        'gpt-oss-20b'
      );

      console.log('📝 Processing research response...');

      // Parse the response to extract structured findings
      const findings = this.parseResearchResponse(response, modelName, modelCard);
      
      // Save research results
      await this.saveResearchResults(findings);
      
      console.log('✅ Research completed successfully!');
      return findings;

    } catch (error) {
      console.error('❌ Research failed:', error);
      throw error;
    }
  }

  /**
   * Parse the AI response into structured research findings
   */
  private parseResearchResponse(response: string, modelName: string, modelCard: any): ResearchFindings {
    // Try to extract JSON from the response if it follows ALAIN-Kit format
    let structuredData: any = {};
    
    try {
      // Look for JSON in the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.log('No structured JSON found, parsing text response...');
    }

    // Extract key information from response text
    const keyFindings = this.extractKeyFindings(response);
    const useCases = this.extractUseCases(response);
    const limitations = this.extractLimitations(response);
    const learningObjectives = this.extractLearningObjectives(response);
    const learningPath = this.extractLearningPath(response);

    return {
      modelName,
      modelCard,
      researchDepth: 'comprehensive',
      keyFindings,
      technicalSpecs: {
        architecture: modelCard.config?.model_type || 'unknown',
        parameters: modelCard.safetensors?.total || 'unknown',
        license: modelCard.cardData?.license || 'unknown',
        languages: modelCard.cardData?.language || [],
        tasks: modelCard.pipeline_tag ? [modelCard.pipeline_tag] : []
      },
      useCases,
      limitations,
      learningObjectives,
      learningPath,
      educationalContext: {
        targetAudience: 'ML practitioners and researchers',
        prerequisites: ['Basic understanding of transformers', 'Python programming'],
        difficulty: 'intermediate'
      },
      qualityScore: this.calculateQualityScore(keyFindings, useCases, limitations),
      timestamp: new Date().toISOString()
    };
  }

  private extractKeyFindings(response: string): string[] {
    const findings: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('finding') || line.includes('key') || line.includes('important')) {
        const cleaned = line.replace(/^[-*•]\s*/, '').trim();
        if (cleaned.length > 10) {
          findings.push(cleaned);
        }
      }
    }
    
    return findings.slice(0, 8); // Limit to top 8 findings
  }

  private extractUseCases(response: string): string[] {
    const useCases: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('use case') || line.includes('application') || line.includes('suitable for')) {
        const cleaned = line.replace(/^[-*•]\s*/, '').trim();
        if (cleaned.length > 10) {
          useCases.push(cleaned);
        }
      }
    }
    
    return useCases.slice(0, 6);
  }

  private extractLimitations(response: string): string[] {
    const limitations: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.includes('limitation') || line.includes('drawback') || line.includes('constraint')) {
        const cleaned = line.replace(/^[-*•]\s*/, '').trim();
        if (cleaned.length > 10) {
          limitations.push(cleaned);
        }
      }
    }
    
    return limitations.slice(0, 5);
  }

  private extractLearningObjectives(response: string): string[] {
    return [
      `Understand ${this.extractModelName} architecture and design principles`,
      'Learn practical implementation techniques',
      'Master fine-tuning and optimization strategies',
      'Explore real-world applications and use cases'
    ];
  }

  private extractLearningPath(response: string): any[] {
    return [
      {
        title: 'Model Architecture Overview',
        difficulty: 'beginner',
        description: 'Introduction to the model\'s core architecture and components',
        estimatedTime: '30 minutes'
      },
      {
        title: 'Hands-on Implementation',
        difficulty: 'intermediate', 
        description: 'Practical coding exercises using the model',
        estimatedTime: '60 minutes'
      },
      {
        title: 'Advanced Applications',
        difficulty: 'advanced',
        description: 'Complex use cases and optimization techniques',
        estimatedTime: '90 minutes'
      }
    ];
  }

  private calculateQualityScore(findings: string[], useCases: string[], limitations: string[]): number {
    let score = 70; // Base score
    
    score += Math.min(findings.length * 3, 15); // Up to 15 points for findings
    score += Math.min(useCases.length * 2, 10); // Up to 10 points for use cases  
    score += Math.min(limitations.length * 1, 5); // Up to 5 points for limitations
    
    return Math.min(score, 100);
  }

  /**
   * Save research results to organized directory structure
   */
  private async saveResearchResults(findings: ResearchFindings): Promise<void> {
    const outputDir = path.join('resources', 'research-outputs', 'alain-kit-research', findings.modelName.replace('/', '-'));
    await mkdir(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, 'research-findings.json');
    await writeFile(outputFile, JSON.stringify(findings, null, 2));
    
    console.log(`💾 Research results saved to: ${outputFile}`);
  }
}

// CLI interface for testing
if (require.main === module) {
  const hfUrl = process.argv[2];
  const topic = process.argv[3];
  
  if (!hfUrl) {
    console.log('Usage: npx ts-node alain-kit-research.ts <huggingface_url> [topic]');
    console.log('Example: npx ts-node alain-kit-research.ts https://huggingface.co/google-bert/bert-base-uncased');
    process.exit(1);
  }
  
  const research = new AlainKitResearch();
  research.runResearch(hfUrl, topic)
    .then((results) => {
      console.log('\n🎉 Research Summary:');
      console.log('='.repeat(50));
      console.log(`Model: ${results.modelName}`);
      console.log(`Quality Score: ${results.qualityScore}/100`);
      console.log(`Key Findings: ${results.keyFindings.length}`);
      console.log(`Use Cases: ${results.useCases.length}`);
      console.log(`Learning Path Steps: ${results.learningPath.length}`);
    })
    .catch((error) => {
      console.error('Research failed:', error.message);
      process.exit(1);
    });
}
