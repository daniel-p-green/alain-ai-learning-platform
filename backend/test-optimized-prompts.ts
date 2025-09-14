#!/usr/bin/env bun

/**
 * Test Optimized ALAIN-Kit Prompts
 * Compare performance and quality of optimized vs current prompts
 */

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface PromptTestResult {
  prompt_version: string;
  model: string;
  success: boolean;
  responseTime: number;
  outputQuality: number;
  tokenCount: number;
  contentLength: number;
  error?: string;
  response?: any;
  fullLog: string[];
}

const TARGET_MODEL_URL = 'https://huggingface.co/openai/gpt-oss-20b';

// Load optimized prompt
const OPTIMIZED_PROMPT = readFileSync('/Users/danielgreen/Downloads/OSS hackathon/alain-ai-learning-platform/prompts/alain-kit/optimized/research.optimized.v1.txt', 'utf-8');

// Current Poe prompt for comparison
const CURRENT_POE_PROMPT = `SYSTEM:
You are ALAIN-Teacher. Gather comprehensive model intelligence (model card, docs, papers, community) and synthesize technical specs, implementation guidance, and educational context. Return structured, accurate findings.

USER:
${TARGET_MODEL_URL}`;

// Performance-optimized version
const PERFORMANCE_PROMPT = `SYSTEM: You are an expert AI model researcher. Generate comprehensive educational research for the specified model.

REQUIREMENTS:
• Technical specs: architecture, parameters, context window, training data, license
• Educational context: prerequisites, learning objectives by skill level, common challenges
• Implementation: code examples, best practices, pitfalls to avoid
• Community resources: repos, tutorials, papers, real-world applications
• Quality score (1-100) with justification

FORMAT: Use clear sections with bullet points. Prioritize accuracy and educational value.

USER: ${TARGET_MODEL_URL}`;

const PROMPTS_TO_TEST = [
  { name: 'current_poe', content: CURRENT_POE_PROMPT },
  { name: 'optimized_v1', content: OPTIMIZED_PROMPT.replace('{{MODEL_REFERENCE_OR_TEXT}}', TARGET_MODEL_URL) },
  { name: 'performance_optimized', content: PERFORMANCE_PROMPT }
];

function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}

function assessOutputQuality(content: string): number {
  let score = 30; // Base score
  
  // Technical specifications
  if (content.includes('Technical') || content.includes('architecture')) score += 15;
  if (content.includes('parameters') || content.includes('billion')) score += 10;
  
  // Educational context
  if (content.includes('Educational') || content.includes('learning')) score += 15;
  if (content.includes('prerequisites') || content.includes('objectives')) score += 10;
  
  // Implementation details
  if (content.includes('Implementation') || content.includes('code')) score += 15;
  if (content.includes('example') || content.includes('```')) score += 5;
  
  // Community resources
  if (content.includes('Community') || content.includes('resources')) score += 10;
  if (content.includes('github') || content.includes('tutorial')) score += 5;
  
  // Quality indicators
  if (content.length > 1000) score += 5;
  if (content.length > 3000) score += 5;
  if (content.includes('Quality') || content.includes('score')) score += 10;
  
  return Math.min(score, 100);
}

async function testPrompt(promptName: string, promptContent: string): Promise<PromptTestResult> {
  const startTime = Date.now();
  const log: string[] = [];
  
  log.push(`🧪 Testing prompt: ${promptName}`);
  log.push(`📏 Estimated tokens: ${estimateTokenCount(promptContent)}`);
  log.push(`⏰ Start time: ${new Date().toISOString()}`);
  
  const poeApiKey = process.env.POE_API_KEY;
  if (!poeApiKey) {
    throw new Error('POE_API_KEY environment variable is not set');
  }

  // Extract system and user messages from prompt
  const lines = promptContent.split('\n');
  const systemIndex = lines.findIndex(line => line.startsWith('SYSTEM:'));
  const userIndex = lines.findIndex(line => line.startsWith('USER:'));
  
  const systemMessage = lines.slice(systemIndex + 1, userIndex).join('\n').trim();
  const userMessage = lines.slice(userIndex + 1).join('\n').trim();

  const payload = {
    model: 'gpt-oss-20b',
    messages: [
      {
        role: 'system',
        content: systemMessage
      },
      {
        role: 'user',
        content: userMessage
      }
    ],
    temperature: 0.2,
    max_tokens: 4096
  };

  try {
    log.push(`📤 Sending request to Poe API`);
    
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${poeApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ALAIN-Research/1.0'
      },
      body: JSON.stringify(payload)
    });

    const responseTime = Date.now() - startTime;
    
    log.push(`📥 Response received in ${responseTime}ms`);
    log.push(`📊 HTTP Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      log.push(`❌ API Error: ${errorText}`);
      return {
        prompt_version: promptName,
        model: 'gpt-oss-20b',
        success: false,
        responseTime,
        outputQuality: 0,
        tokenCount: estimateTokenCount(promptContent),
        contentLength: 0,
        error: `HTTP ${response.status}: ${errorText}`,
        fullLog: log
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content || '';
    
    if (content.length > 100) {
      const qualityScore = assessOutputQuality(content);
      
      log.push(`✅ Response received successfully`);
      log.push(`📝 Content length: ${content.length} characters`);
      log.push(`📈 Quality Score: ${qualityScore}/100`);
      
      return {
        prompt_version: promptName,
        model: 'gpt-oss-20b',
        success: true,
        responseTime,
        outputQuality: qualityScore,
        tokenCount: estimateTokenCount(promptContent),
        contentLength: content.length,
        response: { content },
        fullLog: log
      };
    } else {
      log.push(`❌ Insufficient response content`);
      log.push(`📝 Content: ${content}`);
      
      return {
        prompt_version: promptName,
        model: 'gpt-oss-20b',
        success: false,
        responseTime,
        outputQuality: 0,
        tokenCount: estimateTokenCount(promptContent),
        contentLength: content.length,
        response: message,
        fullLog: log
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    log.push(`💥 Error: ${error.message}`);
    
    return {
      prompt_version: promptName,
      model: 'gpt-oss-20b',
      success: false,
      responseTime,
      outputQuality: 0,
      tokenCount: estimateTokenCount(promptContent),
      contentLength: 0,
      error: error.message,
      fullLog: log
    };
  }
}

async function runPromptOptimizationTest() {
  console.log('🚀 Starting ALAIN-Kit Prompt Optimization Test');
  console.log(`🎯 Target Model: ${TARGET_MODEL_URL}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  
  const results: PromptTestResult[] = [];
  const masterLog: string[] = [];
  
  masterLog.push('# ALAIN-Kit Prompt Optimization Test Log');
  masterLog.push(`**Target Model:** ${TARGET_MODEL_URL}`);
  masterLog.push(`**Test Date:** ${new Date().toISOString()}`);
  masterLog.push(`**Prompts Tested:** ${PROMPTS_TO_TEST.length}`);
  masterLog.push('');
  
  for (let i = 0; i < PROMPTS_TO_TEST.length; i++) {
    const { name, content } = PROMPTS_TO_TEST[i];
    console.log(`\n[${i + 1}/${PROMPTS_TO_TEST.length}] Testing ${name}...`);
    
    const result = await testPrompt(name, content);
    results.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${name}: Quality ${result.outputQuality}/100, Speed ${result.responseTime}ms, Tokens ${result.tokenCount}`);
    
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
    
    // Add to master log
    masterLog.push(`## ${name}`);
    masterLog.push(`- **Status:** ${result.success ? 'Success' : 'Failed'}`);
    masterLog.push(`- **Quality Score:** ${result.outputQuality}/100`);
    masterLog.push(`- **Response Time:** ${result.responseTime}ms`);
    masterLog.push(`- **Token Count:** ${result.tokenCount}`);
    masterLog.push(`- **Content Length:** ${result.contentLength} characters`);
    if (result.error) {
      masterLog.push(`- **Error:** ${result.error}`);
    }
    masterLog.push('');
    masterLog.push('### Detailed Log:');
    result.fullLog.forEach(logLine => {
      masterLog.push(`- ${logLine}`);
    });
    masterLog.push('');
    
    // Add delay to avoid rate limiting
    if (i < PROMPTS_TO_TEST.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Generate comparison analysis
  console.log('\n📊 OPTIMIZATION RESULTS');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  let sortedByPerformance: PromptTestResult[] = [];
  
  if (successful.length > 0) {
    // Sort by performance score (quality/time ratio)
    sortedByPerformance = successful.sort((a, b) => {
      const scoreA = (a.outputQuality / 100) * (10000 / a.responseTime);
      const scoreB = (b.outputQuality / 100) * (10000 / b.responseTime);
      return scoreB - scoreA;
    });
    
    console.log('🏆 PERFORMANCE RANKING:');
    sortedByPerformance.forEach((result, index) => {
      const medal = ['🥇', '🥈', '🥉'][index] || '🏅';
      const efficiency = ((result.outputQuality / 100) * (10000 / result.responseTime)).toFixed(2);
      console.log(`${medal} ${result.prompt_version}: Quality ${result.outputQuality}/100, Speed ${result.responseTime}ms, Efficiency ${efficiency}`);
    });
    
    // Token efficiency analysis
    console.log('\n💰 TOKEN EFFICIENCY:');
    const sortedByTokens = successful.sort((a, b) => a.tokenCount - b.tokenCount);
    sortedByTokens.forEach(result => {
      const qualityPerToken = (result.outputQuality / result.tokenCount * 100).toFixed(2);
      console.log(`📏 ${result.prompt_version}: ${result.tokenCount} tokens, ${qualityPerToken} quality/token`);
    });
    
    // Speed comparison
    console.log('\n⚡ SPEED COMPARISON:');
    const baseline = results.find(r => r.prompt_version === 'current_poe');
    if (baseline && baseline.success) {
      successful.forEach(result => {
        if (result.prompt_version !== 'current_poe') {
          const speedup = baseline.responseTime / result.responseTime;
          const speedupText = speedup > 1 ? `${speedup.toFixed(1)}x faster` : `${(1/speedup).toFixed(1)}x slower`;
          console.log(`🏃 ${result.prompt_version}: ${speedupText} than baseline`);
        }
      });
    }
  } else {
    console.log('❌ No successful tests to analyze');
  }
  
  // Save results
  const timestamp = Date.now();
  const outputDir = '/Users/danielgreen/Downloads/OSS hackathon/alain-ai-learning-platform/hackathon-notes/test-log-output';
  
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
  
  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    target_model: TARGET_MODEL_URL,
    test_summary: {
      total_prompts: results.length,
      successful_prompts: successful.length,
      best_quality: Math.max(...successful.map(r => r.outputQuality)),
      fastest_response: Math.min(...successful.map(r => r.responseTime)),
      most_efficient: successful.length > 0 ? sortedByPerformance[0].prompt_version : null
    },
    results: results,
    optimization_analysis: {
      token_reduction: successful.length > 1 ? 
        `${Math.round((1 - Math.min(...successful.map(r => r.tokenCount)) / Math.max(...successful.map(r => r.tokenCount))) * 100)}%` : 'N/A',
      speed_improvement: baseline && successful.length > 1 ?
        `${Math.round((baseline.responseTime / Math.min(...successful.filter(r => r.prompt_version !== 'current_poe').map(r => r.responseTime)) - 1) * 100)}%` : 'N/A',
      quality_maintained: successful.length > 1 ?
        Math.min(...successful.map(r => r.outputQuality)) >= 80 : false
    }
  };
  
  const resultsFile = join(outputDir, `prompt-optimization-test-${timestamp}.json`);
  writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
  
  const logFile = join(outputDir, `prompt-optimization-log-${timestamp}.md`);
  writeFileSync(logFile, masterLog.join('\n'));
  
  console.log(`\n💾 Results saved to: ${outputDir}`);
  console.log(`📄 Results: prompt-optimization-test-${timestamp}.json`);
  console.log(`📋 Log: prompt-optimization-log-${timestamp}.md`);
  
  return results;
}

// Run the test
if (import.meta.main) {
  runPromptOptimizationTest()
    .then(results => {
      console.log('\n🎯 Prompt optimization test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
