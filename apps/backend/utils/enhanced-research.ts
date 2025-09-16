/**
 * Enhanced Research System for ALAIN AI Learning Platform
 * 
 * Provides deep, structured research capabilities with academic paper integration,
 * GitHub repository analysis, and intelligent content synthesis.
 * 
 * @author ALAIN Research Team
 * @version 1.0.0
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Enhanced research data structure with comprehensive analysis
 */
export interface EnhancedResearchData {
  model: string;
  provider: string;
  topic?: string;
  research_depth: 'basic' | 'intermediate' | 'advanced';
  sources: {
    huggingface?: {
      model_card?: string;
      model_card_analysis?: string;
      repo_info?: any;
      files?: string[];
      key_insights?: string[];
    };
    arxiv?: {
      papers?: Array<{
        title: string;
        authors: string[];
        abstract: string;
        url: string;
        relevance_score: number;
        key_findings?: string[];
      }>;
    };
    github?: {
      repositories?: Array<{
        name: string;
        description: string;
        stars: number;
        url: string;
        readme_content?: string;
        code_analysis?: string;
        relevance_score: number;
      }>;
    };
    academic?: {
      papers?: Array<{
        title: string;
        venue: string;
        year: number;
        abstract: string;
        url: string;
        citations?: number;
        relevance_score: number;
      }>;
    };
    documentation?: {
      official_docs?: Array<{
        title: string;
        content: string;
        url: string;
        section: string;
      }>;
      tutorials?: Array<{
        title: string;
        content_summary: string;
        url: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
      }>;
    };
  };
  synthesis: {
    key_concepts: string[];
    technical_details: string[];
    use_cases: string[];
    limitations: string[];
    best_practices: string[];
    learning_path: string[];
  };
  collected_at: string;
  processing_time_ms: number;
}

/**
 * Search arXiv for relevant academic papers
 * @param modelName - The model name to search for
 * @param topic - Optional topic to focus the search
 * @param maxResults - Maximum number of results to return
 * @returns Array of relevant papers with relevance scores
 */
async function searchArxivPapers(modelName: string, topic?: string, maxResults: number = 8): Promise<any[]> {
  try {
    const searchTerms = [modelName, topic, 'transformer', 'language model']
      .filter(Boolean)
      .join(' AND ');
    
    const arxivUrl = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(searchTerms)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
    
    const response = await fetch(arxivUrl);
    if (!response.ok) return [];
    
    const xmlText = await response.text();
    const papers = parseArxivResponse(xmlText, modelName, topic);
    
    return papers.sort((a, b) => b.relevance_score - a.relevance_score);
  } catch (error) {
    console.error('Error searching arXiv:', error);
    return [];
  }
}

/**
 * Parse arXiv XML response into structured paper data
 */
function parseArxivResponse(xmlText: string, modelName: string, topic?: string): any[] {
  const papers = [];
  const entryRegex = /<entry>(.*?)<\/entry>/gs;
  let match;
  
  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entry = match[1];
    
    const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
    const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
    const authorMatches = entry.match(/<author>.*?<name>(.*?)<\/name>.*?<\/author>/gs);
    const linkMatch = entry.match(/<id>(.*?)<\/id>/s);
    
    if (titleMatch && summaryMatch && linkMatch) {
      const authors = authorMatches 
        ? authorMatches.map(a => a.match(/<name>(.*?)<\/name>/)?.[1] || '').filter(Boolean) 
        : [];
      
      papers.push({
        title: titleMatch[1].trim(),
        authors,
        abstract: summaryMatch[1].trim().replace(/\s+/g, ' '),
        url: linkMatch[1].trim(),
        relevance_score: calculateRelevanceScore(titleMatch[1] + ' ' + summaryMatch[1], modelName, topic)
      });
    }
  }
  
  return papers;
}

/**
 * Search GitHub for relevant repositories with content analysis
 */
async function searchGitHubRepositories(modelName: string, topic?: string, githubToken?: string): Promise<any[]> {
  try {
    console.log(`🐙 Searching GitHub for: ${modelName} ${topic || ''}`);
    
    const searchQuery = [
      modelName,
      topic,
      'language:Python OR language:Jupyter',
      'stars:>10'
    ].filter(Boolean).join(' ');
    
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ALAIN-Research-Bot'
    };
    
    if (githubToken) {
      headers['Authorization'] = `token ${githubToken}`;
    }
    
    const searchUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(searchQuery)}&sort=stars&order=desc&per_page=20`;
    const response = await fetch(searchUrl, { headers });
    
    if (!response.ok) return [];
    
    const data: any = await response.json();
    const repositories = [];
    
    for (const repo of data.items || []) {
      // Fetch README content for analysis
      let readmeContent = '';
      try {
        const readmeUrl = `https://api.github.com/repos/${repo.full_name}/readme`;
        const readmeResponse = await fetch(readmeUrl, { headers });
        if (readmeResponse.ok) {
          const readmeData: any = await readmeResponse.json();
          readmeContent = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        }
      } catch (e) {
        console.log(`Could not fetch README for ${repo.full_name}`);
      }
      
      repositories.push({
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description || '',
        stars: repo.stargazers_count,
        url: repo.html_url,
        readme_content: readmeContent.substring(0, 2000), // Limit size
        relevance_score: calculateRelevanceScore(
          `${repo.name} ${repo.description} ${readmeContent}`,
          modelName,
          topic
        )
      });
    }
    
    return repositories.sort((a, b) => b.relevance_score - a.relevance_score);
  } catch (error) {
    console.error('Error searching GitHub:', error);
    return [];
  }
}

/**
 * Calculate relevance score based on keyword matching and context
 */
function calculateRelevanceScore(content: string, modelName: string, topic?: string): number {
  const normalizedContent = content.toLowerCase();
  const normalizedModel = modelName.toLowerCase();
  const normalizedTopic = topic?.toLowerCase() || '';
  
  let score = 0;
  
  // Model name exact match
  if (normalizedContent.includes(normalizedModel)) score += 10;
  
  // Model name partial matches
  const modelParts = normalizedModel.split(/[-_\s]/);
  modelParts.forEach(part => {
    if (part.length > 2 && normalizedContent.includes(part)) score += 3;
  });
  
  // Topic relevance
  if (normalizedTopic && normalizedContent.includes(normalizedTopic)) score += 8;
  
  // Technical keywords
  const technicalKeywords = [
    'transformer', 'attention', 'neural network', 'deep learning',
    'fine-tuning', 'training', 'inference', 'optimization',
    'benchmark', 'evaluation', 'performance', 'accuracy'
  ];
  
  technicalKeywords.forEach(keyword => {
    if (normalizedContent.includes(keyword)) score += 2;
  });
  
  // Quality indicators
  if (normalizedContent.includes('paper') || normalizedContent.includes('research')) score += 3;
  if (normalizedContent.includes('tutorial') || normalizedContent.includes('guide')) score += 2;
  if (normalizedContent.includes('example') || normalizedContent.includes('demo')) score += 1;
  
  return score;
}

/**
 * Synthesize research findings into structured insights
 */
function synthesizeResearchFindings(data: EnhancedResearchData): EnhancedResearchData['synthesis'] {
  const synthesis: EnhancedResearchData['synthesis'] = {
    key_concepts: [],
    technical_details: [],
    use_cases: [],
    limitations: [],
    best_practices: [],
    learning_path: []
  };
  
  // Extract comprehensive insights from model card
  if (data.sources.huggingface?.model_card) {
    const modelCard = data.sources.huggingface.model_card.toLowerCase();
    
    // Enhanced key concepts extraction
    const conceptMappings = {
      'transformer': 'Transformer-based neural architecture for sequence processing',
      'attention': 'Self-attention mechanisms for contextual understanding',
      'decoder': 'Decoder-only architecture for autoregressive generation',
      'encoder': 'Encoder architecture for representation learning',
      'fine-tuned': 'Fine-tuned on specific datasets for task optimization',
      'pretrained': 'Pre-trained on large-scale text corpora',
      'multilingual': 'Supports multiple languages and cross-lingual tasks',
      'conversational': 'Optimized for dialogue and chat applications',
      'instruction': 'Trained to follow instructions and user prompts',
      'code': 'Specialized for code generation and programming tasks'
    };
    
    Object.entries(conceptMappings).forEach(([keyword, description]) => {
      if (modelCard.includes(keyword)) {
        synthesis.key_concepts.push(description);
      }
    });
    
    // Enhanced technical details extraction
    const paramMatch = modelCard.match(/(\d+\.?\d*)\s*(billion|million|b|m)\s*parameters/i);
    if (paramMatch) {
      synthesis.technical_details.push(`Model size: ${paramMatch[1]}${paramMatch[2]} parameters`);
    }
    
    const contextMatch = modelCard.match(/(\d+k?)\s*context/i);
    if (contextMatch) {
      synthesis.technical_details.push(`Context window: ${contextMatch[1]} tokens`);
    }
    
    const precisionMatch = modelCard.match(/(fp16|bf16|int8|int4)/i);
    if (precisionMatch) {
      synthesis.technical_details.push(`Precision: ${precisionMatch[1]} quantization supported`);
    }
    
    // Enhanced use cases with context
    const useCaseMappings = {
      'text generation': 'Creative writing, content generation, and text completion',
      'chat': 'Conversational AI, chatbots, and interactive dialogue systems',
      'completion': 'Code completion, text finishing, and auto-suggestion',
      'reasoning': 'Logical reasoning, problem-solving, and analytical tasks',
      'coding': 'Code generation, debugging, and programming assistance',
      'translation': 'Language translation and cross-lingual communication',
      'summarization': 'Text summarization and content condensation',
      'question answering': 'Information retrieval and knowledge-based Q&A',
      'classification': 'Text classification and sentiment analysis',
      'embedding': 'Text embeddings and semantic similarity tasks'
    };
    
    Object.entries(useCaseMappings).forEach(([keyword, description]) => {
      if (modelCard.includes(keyword)) {
        synthesis.use_cases.push(description);
      }
    });
    
    // Extract limitations and considerations
    const limitationKeywords = ['bias', 'hallucination', 'accuracy', 'safety', 'harmful', 'limitation'];
    limitationKeywords.forEach(keyword => {
      if (modelCard.includes(keyword)) {
        synthesis.limitations.push(`Consider ${keyword} implications when using this model`);
      }
    });
    
    // Extract best practices from model card
    if (modelCard.includes('temperature')) {
      synthesis.best_practices.push('Adjust temperature parameter for creativity vs consistency balance');
    }
    if (modelCard.includes('prompt')) {
      synthesis.best_practices.push('Use clear, specific prompts for better results');
    }
    if (modelCard.includes('system')) {
      synthesis.best_practices.push('Utilize system messages for role definition and behavior control');
    }
  }
  
  // Extract insights from arXiv papers
  if (data.sources.arxiv?.papers) {
    data.sources.arxiv.papers.slice(0, 3).forEach(paper => {
      if (paper.relevance_score > 5) {
        synthesis.key_concepts.push(`Research finding: ${paper.title.substring(0, 100)}...`);
        synthesis.best_practices.push(`Study methodology from: ${paper.title.substring(0, 80)}...`);
      }
    });
  }
  
  // Extract insights from GitHub repositories
  if (data.sources.github?.repositories) {
    data.sources.github.repositories.slice(0, 5).forEach(repo => {
      if (repo.relevance_score > 5) {
        synthesis.best_practices.push(`Community implementation: ${repo.name} - ${repo.description?.substring(0, 60)}...`);
        synthesis.use_cases.push(`Real-world application: ${repo.name} demonstrates practical usage`);
      }
    });
  }
  
  // Topic-specific learning path based on research focus
  if (data.topic) {
    const topicLower = data.topic.toLowerCase();
    if (topicLower.includes('chatgpt') || topicLower.includes('chat')) {
      synthesis.learning_path = [
        'Understand conversational AI fundamentals and dialogue systems',
        'Study the model architecture and training methodology',
        'Learn prompt engineering techniques for chat applications',
        'Implement basic chat interface with context management',
        'Explore advanced features: web search integration, memory, tools',
        'Practice parameter tuning: temperature, top-p, context window',
        'Build multiple choice knowledge checkpoints for learning validation',
        'Deploy and test in real conversational scenarios'
      ];
    } else if (topicLower.includes('code') || topicLower.includes('programming')) {
      synthesis.learning_path = [
        'Review code generation capabilities and limitations',
        'Study programming language support and syntax understanding',
        'Practice with simple code completion tasks',
        'Implement code review and debugging workflows',
        'Explore advanced code generation patterns',
        'Test with real-world programming challenges'
      ];
    } else {
      synthesis.learning_path = [
        'Start with model documentation and architecture overview',
        'Review academic papers for theoretical foundation',
        'Explore practical implementations and examples',
        'Practice with hands-on tutorials and notebooks',
        'Apply to real-world use cases and projects',
        'Experiment with parameter optimization and fine-tuning'
      ];
    }
  } else {
    synthesis.learning_path = [
      'Start with model documentation and architecture overview',
      'Review academic papers for theoretical foundation',
      'Explore practical implementations and examples',
      'Practice with hands-on tutorials and notebooks',
      'Apply to real-world use cases and projects'
    ];
  }
  
  // Add topic-specific best practices
  if (data.topic?.toLowerCase().includes('chatgpt')) {
    synthesis.best_practices.push('Implement conversation history management for context continuity');
    synthesis.best_practices.push('Use system prompts to define AI assistant behavior and personality');
    synthesis.best_practices.push('Add safety filters and content moderation for production use');
    synthesis.best_practices.push('Implement rate limiting and usage monitoring');
  }
  
  return synthesis;
}

/**
 * Generate organized output directory path: model-maker/model-name/
 */
function generateOutputPath(modelName: string, baseDir?: string): string {
  const parts = modelName.split('/');
  if (parts.length === 2) {
    // Format: microsoft/DialoGPT-medium -> microsoft/DialoGPT-medium/
    const [maker, model] = parts;
    return baseDir ? join(baseDir, maker, model) : join('resources', 'research-outputs', maker, model);
  } else {
    // Single name models - map known patterns to makers
    let maker = 'unknown';
    const model = modelName;
    
    // Map GPT-OSS models to OpenAI
    if (modelName.toLowerCase().includes('gpt-oss')) {
      maker = 'openai';
    }
    // Add other known patterns here as needed
    // else if (modelName.toLowerCase().includes('claude')) {
    //   maker = 'anthropic';
    // }
    
    return baseDir ? join(baseDir, maker, model) : join('resources', 'research-outputs', maker, model);
  }
}

/**
 * Enhanced research function with deep analysis
 */
export async function enhancedResearchModel(
  modelName: string,
  provider: string = 'poe',
  topic?: string,
  depth: 'basic' | 'intermediate' | 'advanced' = 'intermediate',
  outputDir?: string,
  githubToken?: string
): Promise<EnhancedResearchData> {
  const startTime = Date.now();
  console.log(`🔬 Starting enhanced research for: ${modelName} (depth: ${depth})`);
  
  const researchData: EnhancedResearchData = {
    model: modelName,
    provider,
    topic,
    research_depth: depth,
    sources: {},
    synthesis: {
      key_concepts: [],
      technical_details: [],
      use_cases: [],
      limitations: [],
      best_practices: [],
      learning_path: []
    },
    collected_at: new Date().toISOString(),
    processing_time_ms: 0
  };
  
  try {
    // Fetch Hugging Face data with enhanced analysis
    if (modelName.includes('/') || modelName.startsWith('gpt-oss')) {
      const hfPath = modelName.includes('/') ? modelName : `microsoft/${modelName}`;
      console.log(`🤗 Fetching enhanced Hugging Face data for: ${hfPath}`);
      
      // Fetch model card
      const modelCardUrl = `https://huggingface.co/${hfPath}/raw/main/README.md`;
      const modelCardResponse = await fetch(modelCardUrl);
      const modelCard = modelCardResponse.ok ? await modelCardResponse.text() : null;
      
      // Fetch repository info
      const apiUrl = `https://huggingface.co/api/models/${hfPath}`;
      const apiResponse = await fetch(apiUrl);
      const repoInfo = apiResponse.ok ? await apiResponse.json() : null;
      
      // Analyze model card for key insights
      let keyInsights: string[] = [];
      if (modelCard) {
        keyInsights = extractKeyInsights(modelCard);
      }
      
      researchData.sources.huggingface = {
        model_card: modelCard || undefined,
        model_card_analysis: analyzeModelCard(modelCard),
        repo_info: repoInfo,
        key_insights: keyInsights
      };
    }
    
    // Search arXiv papers for advanced depth
    if (depth === 'advanced' || depth === 'intermediate') {
      const maxPapers = depth === 'advanced' ? 15 : 8;
      const papers = await searchArxivPapers(modelName, topic, maxPapers);
      researchData.sources.arxiv = { papers };
    }
    
    // Search GitHub repositories
    const maxRepos = depth === 'advanced' ? 20 : depth === 'intermediate' ? 12 : 8;
    const repositories = await searchGitHubRepositories(modelName, topic, githubToken);
    researchData.sources.github = { repositories: repositories.slice(0, maxRepos) };
    
    // Synthesize findings
    researchData.synthesis = synthesizeResearchFindings(researchData);
    
    // Calculate processing time
    researchData.processing_time_ms = Date.now() - startTime;
    
    // Save enhanced research data with organized directory structure
    const finalOutputDir = outputDir || generateOutputPath(modelName);
    
    if (!existsSync(finalOutputDir)) {
      mkdirSync(finalOutputDir, { recursive: true });
    }
    
    const researchFile = join(finalOutputDir, 'enhanced-research-data.json');
    writeFileSync(researchFile, JSON.stringify(researchData, null, 2));
    
    // Generate comprehensive markdown report
    const markdownReport = generateEnhancedMarkdownReport(researchData);
    const reportFile = join(finalOutputDir, 'enhanced-research-report.md');
    writeFileSync(reportFile, markdownReport);
    
    console.log(`✅ Enhanced research saved to: ${finalOutputDir}`);
    
  } catch (error) {
    console.error('Error in enhanced research:', error);
  }
  
  return researchData;
}

/**
 * Extract key insights from model card content
 */
function extractKeyInsights(modelCard: string): string[] {
  const insights: string[] = [];
  const lines = modelCard.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Extract architecture information
    if (trimmed.toLowerCase().includes('architecture') && trimmed.length < 200) {
      insights.push(`Architecture: ${trimmed}`);
    }
    
    // Extract training information
    if (trimmed.toLowerCase().includes('training') && trimmed.length < 200) {
      insights.push(`Training: ${trimmed}`);
    }
    
    // Extract performance metrics
    if (trimmed.match(/\d+\.?\d*%|\d+\.?\d*\s*(accuracy|f1|bleu|rouge)/i)) {
      insights.push(`Performance: ${trimmed}`);
    }
    
    // Extract limitations
    if (trimmed.toLowerCase().includes('limitation') && trimmed.length < 200) {
      insights.push(`Limitation: ${trimmed}`);
    }
  }
  
  return insights.slice(0, 10); // Limit to top 10 insights
}

/**
 * Analyze model card content for structured information
 */
function analyzeModelCard(modelCard: string | null): string {
  if (!modelCard) return 'No model card available for analysis.';
  
  const analysis = [];
  const lowerCard = modelCard.toLowerCase();
  
  // Model size analysis
  const sizeMatch = modelCard.match(/(\d+\.?\d*)\s*(billion|million|b|m)\s*parameters/i);
  if (sizeMatch) {
    analysis.push(`Model Size: ${sizeMatch[1]}${sizeMatch[2]} parameters`);
  }
  
  // Architecture analysis
  if (lowerCard.includes('transformer')) analysis.push('Architecture: Transformer-based');
  if (lowerCard.includes('llama')) analysis.push('Architecture: LLaMA-based');
  if (lowerCard.includes('mistral')) analysis.push('Architecture: Mistral-based');
  
  // Training data analysis
  if (lowerCard.includes('instruct') || lowerCard.includes('instruction')) {
    analysis.push('Training: Instruction-tuned model');
  }
  if (lowerCard.includes('chat') || lowerCard.includes('conversation')) {
    analysis.push('Training: Optimized for conversational tasks');
  }
  
  // Capabilities analysis
  const capabilities = [];
  if (lowerCard.includes('code') || lowerCard.includes('programming')) capabilities.push('coding');
  if (lowerCard.includes('math') || lowerCard.includes('reasoning')) capabilities.push('mathematical reasoning');
  if (lowerCard.includes('multilingual')) capabilities.push('multilingual support');
  
  if (capabilities.length > 0) {
    analysis.push(`Capabilities: ${capabilities.join(', ')}`);
  }
  
  return analysis.join('\n') || 'Basic model information extracted.';
}

/**
 * Generate comprehensive markdown report
 */
function generateEnhancedMarkdownReport(data: EnhancedResearchData): string {
  let report = `# Enhanced Research Report: ${data.model}\n\n`;
  report += `**Provider:** ${data.provider}\n`;
  report += `**Research Depth:** ${data.research_depth}\n`;
  report += `**Topic Focus:** ${data.topic || 'General'}\n`;
  report += `**Generated:** ${data.collected_at}\n`;
  report += `**Processing Time:** ${data.processing_time_ms}ms\n\n`;
  
  // Executive Summary
  report += `## Executive Summary\n\n`;
  report += `This enhanced research analysis provides comprehensive insights into ${data.model}, `;
  report += `including technical specifications, academic research, practical implementations, and learning resources.\n\n`;
  
  // Key Findings
  report += `## Key Findings\n\n`;
  if (data.synthesis.key_concepts.length > 0) {
    data.synthesis.key_concepts.forEach(concept => {
      report += `- ${concept}\n`;
    });
  } else {
    report += `- Comprehensive analysis in progress\n`;
  }
  report += `\n`;
  
  // Technical Details
  if (data.synthesis.technical_details.length > 0) {
    report += `## Technical Specifications\n\n`;
    data.synthesis.technical_details.forEach(detail => {
      report += `- ${detail}\n`;
    });
    report += `\n`;
  }
  
  // Model Card Analysis
  if (data.sources.huggingface?.model_card_analysis) {
    report += `## Model Analysis\n\n`;
    report += `${data.sources.huggingface.model_card_analysis}\n\n`;
  }
  
  // Academic Research
  if (data.sources.arxiv?.papers && data.sources.arxiv.papers.length > 0) {
    report += `## Academic Research\n\n`;
    data.sources.arxiv.papers.slice(0, 5).forEach(paper => {
      report += `### ${paper.title}\n`;
      report += `**Authors:** ${paper.authors.join(', ')}\n`;
      report += `**Relevance Score:** ${paper.relevance_score}/10\n`;
      report += `**Abstract:** ${paper.abstract.substring(0, 300)}...\n`;
      report += `**URL:** [View Paper](${paper.url})\n\n`;
    });
  }
  
  // GitHub Repositories
  if (data.sources.github?.repositories && data.sources.github.repositories.length > 0) {
    report += `## Implementation Examples\n\n`;
    data.sources.github.repositories.slice(0, 5).forEach(repo => {
      report += `### [${repo.name}](${repo.url})\n`;
      report += `**Description:** ${repo.description}\n`;
      report += `**Stars:** ${repo.stars}\n`;
      report += `**Relevance Score:** ${repo.relevance_score}/10\n\n`;
    });
  }
  
  // Use Cases
  if (data.synthesis.use_cases.length > 0) {
    report += `## Use Cases\n\n`;
    data.synthesis.use_cases.forEach(useCase => {
      report += `- ${useCase}\n`;
    });
    report += `\n`;
  }
  
  // Best Practices
  if (data.synthesis.best_practices.length > 0) {
    report += `## Best Practices\n\n`;
    data.synthesis.best_practices.forEach(practice => {
      report += `- ${practice}\n`;
    });
    report += `\n`;
  }
  
  // Learning Path
  report += `## Recommended Learning Path\n\n`;
  data.synthesis.learning_path.forEach((step, index) => {
    report += `${index + 1}. ${step}\n`;
  });
  report += `\n`;
  
  // Limitations
  if (data.synthesis.limitations.length > 0) {
    report += `## Limitations and Considerations\n\n`;
    data.synthesis.limitations.forEach(limitation => {
      report += `- ${limitation}\n`;
    });
    report += `\n`;
  }
  
  return report;
}
