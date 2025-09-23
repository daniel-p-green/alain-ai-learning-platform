#!/usr/bin/env bun

/**
 * Test ALAIN-Kit v0.2b Simplified Prompts
 * Compare against v0.1 Harmony prompts for reliability and performance
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface PromptTestResult {
  version: string;
  phase: string;
  success: boolean;
  responseTime: number;
  jsonParseSuccess: boolean;
  contentLength: number;
  tokenCount: number;
  qualityScore: number;
  error?: string;
  response?: any;
}

const TARGET_MODEL_URL = 'https://huggingface.co/openai/gpt-oss-20b';

// Load v0.2b prompts
const V2_BASE_PATH = 'packages/alain-kit/resources/prompts/alain-kit-v0.2b/core/';
const V2_PROMPTS = {
  research: readFileSync(join(process.cwd(), V2_BASE_PATH, '01-research.txt'), 'utf8'),
  outline: readFileSync(join(process.cwd(), V2_BASE_PATH, '02-outline.txt'), 'utf8'),
  validate: readFileSync(join(process.cwd(), V2_BASE_PATH, '04-validate.txt'), 'utf8')
};

// Load v0.1 prompts for comparison
const V0_1_BASE_PATH = 'packages/alain-kit/resources/prompts/alain-kit/flattened/poe/';
const V0_1_PROMPTS = {
  research: readFileSync(join(process.cwd(), V0_1_BASE_PATH, 'research.online.v2025-09-13.txt'), 'utf8'),
  // Note: v0.1 doesn't have separate outline/validate, using research as baseline
  outline: readFileSync(join(process.cwd(), V0_1_BASE_PATH, 'research.online.v2025-09-13.txt'), 'utf8'),
  validate: readFileSync(join(process.cwd(), V0_1_BASE_PATH, 'validate.online.v2025-09-13.txt'), 'utf8')
};

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

function assessContentQuality(content: string, expectedFormat: 'json' | 'markdown'): number {
  let score = 30; // Base score
  
  if (expectedFormat === 'json') {
    // JSON-specific quality checks
    if (content.includes('"model_name"')) score += 15;
    if (content.includes('"technical_specs"')) score += 15;
    if (content.includes('"educational_context"')) score += 15;
    if (content.includes('"quality_score"')) score += 10;
  } else {
    // Markdown-specific quality checks
    if (content.includes('##')) score += 10;
    if (content.includes('```')) score += 10;
    if (content.includes('**Note:**')) score += 5;
  }
  
  // General quality indicators
  if (content.length > 1000) score += 10;
  if (content.length > 3000) score += 5;
  
  return Math.min(score, 100);
}

async function testPrompt(
  version: string, 
  phase: string, 
  promptContent: string, 
  expectedFormat: 'json' | 'markdown' = 'json'
): Promise<PromptTestResult> {
  const startTime = Date.now();
  
  const poeApiKey = process.env.POE_API_KEY;
  if (!poeApiKey) {
    throw new Error('POE_API_KEY environment variable is not set');
  }

  // Parse prompt format
  const lines = promptContent.split('\n');
  let systemMessage = '';
  let userMessage = TARGET_MODEL_URL;
  
  if (promptContent.includes('SYSTEM:')) {
    const systemIndex = lines.findIndex(line => line.startsWith('SYSTEM:'));
    const userIndex = lines.findIndex(line => line.startsWith('USER:'));
    
    systemMessage = lines.slice(systemIndex + 1, userIndex > -1 ? userIndex : undefined)
      .join('\n').trim();
    
    if (userIndex > -1) {
      userMessage = lines.slice(userIndex + 1).join('\n').trim()
        .replace('{{MODEL_REFERENCE_OR_TEXT}}', TARGET_MODEL_URL);
    }
  } else {
    // Handle v0.1 format
    systemMessage = promptContent.replace('{{MODEL_REFERENCE_OR_TEXT}}', TARGET_MODEL_URL);
  }

  const payload = {
    model: 'gpt-oss-20b',
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.2,
    max_tokens: 3000
  };

  try {
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${poeApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const errorText = await response.text();
      return {
        version,
        phase,
        success: false,
        responseTime,
        jsonParseSuccess: false,
        contentLength: 0,
        tokenCount: estimateTokenCount(promptContent),
        qualityScore: 0,
        error: `HTTP ${response.status}: ${errorText}`
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    let jsonParseSuccess = true;
    let parsedContent = content;
    
    if (expectedFormat === 'json') {
      try {
        parsedContent = JSON.parse(content);
        jsonParseSuccess = true;
      } catch (error) {
        jsonParseSuccess = false;
      }
    }
    
    const qualityScore = assessContentQuality(content, expectedFormat);
    
    return {
      version,
      phase,
      success: content.length > 100,
      responseTime,
      jsonParseSuccess,
      contentLength: content.length,
      tokenCount: estimateTokenCount(promptContent),
      qualityScore,
      response: { content: content.substring(0, 500) + '...' } // Truncated for logging
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      version,
      phase,
      success: false,
      responseTime,
      jsonParseSuccess: false,
      contentLength: 0,
      tokenCount: estimateTokenCount(promptContent),
      qualityScore: 0,
      error: error.message
    };
  }
}

async function runComparisonTest() {
  console.log('🚀 Starting ALAIN-Kit v0.2b vs v0.1 Comparison Test');
  console.log(`🎯 Target Model: ${TARGET_MODEL_URL}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  
  const results: PromptTestResult[] = [];
  const phases = ['research']; // Start with research phase only
  
  for (const phase of phases) {
    console.log(`\n📋 Testing ${phase} phase...`);
    
    // Test v0.1
    console.log(`  🔄 Testing v0.1 ${phase}...`);
    const v0_1Result = await testPrompt('v0.1', phase, V0_1_PROMPTS[phase]);
    results.push(v0_1Result);
    
    const v0_1Status = v0_1Result.success ? '✅' : '❌';
    const v0_1JsonStatus = v0_1Result.jsonParseSuccess ? '✅' : '❌';
    console.log(`    ${v0_1Status} Success: ${v0_1Result.success}, JSON Parse: ${v0_1JsonStatus}, Quality: ${v0_1Result.qualityScore}/100, Time: ${v0_1Result.responseTime}ms`);
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test v0.2b
    console.log(`  🔄 Testing v0.2b ${phase}...`);
    const v2Result = await testPrompt('v0.2b', phase, V2_PROMPTS[phase]);
    results.push(v2Result);
    
    const v2Status = v2Result.success ? '✅' : '❌';
    const v2JsonStatus = v2Result.jsonParseSuccess ? '✅' : '❌';
    console.log(`    ${v2Status} Success: ${v2Result.success}, JSON Parse: ${v2JsonStatus}, Quality: ${v2Result.qualityScore}/100, Time: ${v2Result.responseTime}ms`);
    
    // Wait to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Generate comparison analysis
  console.log('\n📊 COMPARISON RESULTS');
  console.log('='.repeat(50));
  
  const v0_1Results = results.filter(r => r.version === 'v0.1');
  const v2Results = results.filter(r => r.version === 'v0.2b');
  
  const v0_1SuccessRate = v0_1Results.filter(r => r.success).length / v0_1Results.length;
  const v2SuccessRate = v2Results.filter(r => r.success).length / v2Results.length;
  
  const v0_1JsonSuccessRate = v0_1Results.filter(r => r.jsonParseSuccess).length / v0_1Results.length;
  const v2JsonSuccessRate = v2Results.filter(r => r.jsonParseSuccess).length / v2Results.length;
  
  const v0_1AvgResponseTime = v0_1Results.reduce((sum, r) => sum + r.responseTime, 0) / v0_1Results.length;
  const v2AvgResponseTime = v2Results.reduce((sum, r) => sum + r.responseTime, 0) / v2Results.length;
  
  const v0_1AvgQuality = v0_1Results.reduce((sum, r) => sum + r.qualityScore, 0) / v0_1Results.length;
  const v2AvgQuality = v2Results.reduce((sum, r) => sum + r.qualityScore, 0) / v2Results.length;
  
  const v0_1AvgTokens = v0_1Results.reduce((sum, r) => sum + r.tokenCount, 0) / v0_1Results.length;
  const v2AvgTokens = v2Results.reduce((sum, r) => sum + r.tokenCount, 0) / v2Results.length;
  
  console.log('🏆 SUCCESS RATES:');
  console.log(`   v0.1: ${(v0_1SuccessRate * 100).toFixed(1)}%`);
  console.log(`   v0.2b: ${(v2SuccessRate * 100).toFixed(1)}%`);
  console.log(`   Improvement: ${((v2SuccessRate - v0_1SuccessRate) * 100).toFixed(1)}%`);
  
  console.log('\n🔧 JSON PARSING:');
  console.log(`   v0.1: ${(v0_1JsonSuccessRate * 100).toFixed(1)}%`);
  console.log(`   v0.2b: ${(v2JsonSuccessRate * 100).toFixed(1)}%`);
  console.log(`   Improvement: ${((v2JsonSuccessRate - v0_1JsonSuccessRate) * 100).toFixed(1)}%`);
  
  console.log('\n⚡ RESPONSE TIME:');
  console.log(`   v0.1: ${v0_1AvgResponseTime.toFixed(0)}ms`);
  console.log(`   v0.2b: ${v2AvgResponseTime.toFixed(0)}ms`);
  console.log(`   Improvement: ${(((v0_1AvgResponseTime - v2AvgResponseTime) / v0_1AvgResponseTime) * 100).toFixed(1)}%`);
  
  console.log('\n📈 QUALITY SCORES:');
  console.log(`   v0.1: ${v0_1AvgQuality.toFixed(1)}/100`);
  console.log(`   v0.2b: ${v2AvgQuality.toFixed(1)}/100`);
  console.log(`   Change: ${(v2AvgQuality - v0_1AvgQuality).toFixed(1)} points`);
  
  console.log('\n💰 TOKEN EFFICIENCY:');
  console.log(`   v0.1: ${v0_1AvgTokens.toFixed(0)} tokens`);
  console.log(`   v0.2b: ${v2AvgTokens.toFixed(0)} tokens`);
  console.log(`   Reduction: ${(((v0_1AvgTokens - v2AvgTokens) / v0_1AvgTokens) * 100).toFixed(1)}%`);
  
  // Save detailed results
  const timestamp = Date.now();
  const outputDir = 'test-output/v0.2b-comparison';
  
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
  
  const detailedResults = {
    timestamp: new Date().toISOString(),
    target_model: TARGET_MODEL_URL,
    summary: {
      v0_1_success_rate: v0_1SuccessRate,
      v2_success_rate: v2SuccessRate,
      v0_1_json_success_rate: v0_1JsonSuccessRate,
      v2_json_success_rate: v2JsonSuccessRate,
      v0_1_avg_response_time: v0_1AvgResponseTime,
      v2_avg_response_time: v2AvgResponseTime,
      v0_1_avg_quality: v0_1AvgQuality,
      v2_avg_quality: v2AvgQuality,
      v0_1_avg_tokens: v0_1AvgTokens,
      v2_avg_tokens: v2AvgTokens,
      improvements: {
        success_rate: (v2SuccessRate - v0_1SuccessRate) * 100,
        json_parsing: (v2JsonSuccessRate - v0_1JsonSuccessRate) * 100,
        response_time: ((v0_1AvgResponseTime - v2AvgResponseTime) / v0_1AvgResponseTime) * 100,
        token_efficiency: ((v0_1AvgTokens - v2AvgTokens) / v0_1AvgTokens) * 100
      }
    },
    detailed_results: results
  };
  
  const resultsFile = join(outputDir, `comparison-test-${timestamp}.json`);
  writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
  
  console.log(`\n💾 Results saved to: ${resultsFile}`);
  
  return results;
}

// Run the test
if (import.meta.main) {
  runComparisonTest()
    .then(results => {
      console.log('\n🎯 v0.2b comparison test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
