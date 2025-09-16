#!/usr/bin/env bun

/**
 * Comprehensive Teacher Model Comparison Test
 * Tests multiple teacher models through Poe API for enhanced research phase
 * Target: https://huggingface.co/openai/gpt-oss-20b
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface ModelTestResult {
  model: string;
  success: boolean;
  responseTime: number;
  outputQuality: number;
  supportsFunctionCalling: boolean;
  error?: string;
  response?: any;
  fullLog: string[];
}

interface ResearchOutput {
  model_name: string;
  model_url: string;
  technical_specs: any;
  educational_context: any;
  implementation_guide: any;
  community_resources: any;
  quality_score: number;
}

const MODELS_TO_TEST = [
  'gpt-oss-20b',
  'gpt-oss-120b', 
  'gpt-5-chat',
  'gpt-5',
  'gpt-5-mini',
  'GPT-OSS-120B-T',
  'GPT-OSS-120B-CS',
  'OpenAI-GPT-OSS-20B',
  'GPT-OSS-20B-T'
];

const TARGET_MODEL_URL = 'https://huggingface.co/openai/gpt-oss-20b';

const ENHANCED_RESEARCH_PROMPT = `You are an expert AI researcher and educator. Analyze the following AI model and provide comprehensive research findings for educational purposes.

Model URL: ${TARGET_MODEL_URL}

Please provide detailed research findings including:

1. Technical Specifications:
   - Architecture details
   - Parameter count
   - Context window size
   - Training data sources
   - License information

2. Educational Context:
   - Prerequisites for learners
   - Learning objectives
   - Difficulty level (Beginner/Intermediate/Advanced)
   - Common challenges students face

3. Implementation Guide:
   - Code examples for key use cases
   - Best practices for implementation
   - Common pitfalls to avoid
   - Performance optimization tips

4. Community Resources:
   - Relevant tutorials and documentation
   - Research papers
   - GitHub repositories
   - Community discussions

5. Quality Assessment:
   - Provide a quality score (1-100) based on educational value
   - Justify the score with specific criteria

Format your response as structured JSON or use clear sections if JSON is not supported.`;

const FUNCTION_CALLING_SCHEMA = {
  name: 'emit_research_findings',
  description: 'Emit structured research findings for the AI model',
  parameters: {
    type: 'object',
    properties: {
      model_name: { type: 'string' },
      model_url: { type: 'string' },
      technical_specs: {
        type: 'object',
        properties: {
          architecture: { type: 'string' },
          parameters: { type: 'string' },
          context_window: { type: 'integer' },
          training_data: { type: 'array', items: { type: 'string' } },
          license: { type: 'string' }
        }
      },
      educational_context: {
        type: 'object',
        properties: {
          prerequisites: { type: 'array', items: { type: 'string' } },
          learning_objectives: { type: 'array', items: { type: 'string' } },
          difficulty_level: { type: 'string' },
          common_challenges: { type: 'array', items: { type: 'string' } }
        }
      },
      implementation_guide: {
        type: 'object',
        properties: {
          code_examples: { type: 'array', items: { type: 'object' } },
          best_practices: { type: 'array', items: { type: 'string' } },
          common_pitfalls: { type: 'array', items: { type: 'string' } }
        }
      },
      community_resources: {
        type: 'object',
        properties: {
          tutorials: { type: 'array', items: { type: 'string' } },
          papers: { type: 'array', items: { type: 'string' } },
          github_repos: { type: 'array', items: { type: 'string' } }
        }
      },
      quality_score: { type: 'integer', minimum: 1, maximum: 100 }
    },
    required: ['model_name', 'model_url', 'technical_specs', 'educational_context', 'implementation_guide', 'community_resources', 'quality_score']
  }
};

async function testModelWithFunctionCalling(model: string): Promise<ModelTestResult> {
  const startTime = Date.now();
  const log: string[] = [];
  
  log.push(`🧪 Testing model: ${model} with function calling`);
  log.push(`⏰ Start time: ${new Date().toISOString()}`);
  
  const poeApiKey = process.env.POE_API_KEY;
  if (!poeApiKey) {
    throw new Error('POE_API_KEY environment variable is not set');
  }

  const payload = {
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert AI researcher. Use the provided function to emit structured research findings.'
      },
      {
        role: 'user',
        content: ENHANCED_RESEARCH_PROMPT
      }
    ],
    tools: [{
      type: 'function',
      function: FUNCTION_CALLING_SCHEMA
    }],
    temperature: 0.2,
    max_tokens: 4096
  };

  try {
    log.push(`📤 Sending request to Poe API for model: ${model}`);
    
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
    const data = await response.json();
    
    log.push(`📥 Response received in ${responseTime}ms`);
    log.push(`📊 HTTP Status: ${response.status}`);
    
    if (!response.ok) {
      log.push(`❌ API Error: ${JSON.stringify(data)}`);
      return {
        model,
        success: false,
        responseTime,
        outputQuality: 0,
        supportsFunctionCalling: false,
        error: `HTTP ${response.status}: ${JSON.stringify(data)}`,
        fullLog: log
      };
    }

    const message = data.choices?.[0]?.message;
    const hasFunctionCall = message?.tool_calls?.[0]?.function?.name === 'emit_research_findings';
    
    if (hasFunctionCall) {
      log.push(`✅ Function calling successful`);
      const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
      const qualityScore = functionArgs.quality_score || 0;
      
      log.push(`📈 Quality Score: ${qualityScore}/100`);
      log.push(`🎯 Research findings extracted successfully`);
      
      return {
        model,
        success: true,
        responseTime,
        outputQuality: qualityScore,
        supportsFunctionCalling: true,
        response: functionArgs,
        fullLog: log
      };
    } else {
      log.push(`❌ Function calling not supported or failed`);
      log.push(`📝 Raw response: ${message?.content || 'No content'}`);
      
      return {
        model,
        success: false,
        responseTime,
        outputQuality: 0,
        supportsFunctionCalling: false,
        response: message,
        fullLog: log
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    log.push(`💥 Error: ${error.message}`);
    
    return {
      model,
      success: false,
      responseTime,
      outputQuality: 0,
      supportsFunctionCalling: false,
      error: error.message,
      fullLog: log
    };
  }
}

async function testModelWithTextParsing(model: string): Promise<ModelTestResult> {
  const startTime = Date.now();
  const log: string[] = [];
  
  log.push(`🧪 Testing model: ${model} with text parsing (fallback)`);
  log.push(`⏰ Start time: ${new Date().toISOString()}`);
  
  const poeApiKey = process.env.POE_API_KEY;
  if (!poeApiKey) {
    throw new Error('POE_API_KEY environment variable is not set');
  }

  const payload = {
    model: model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert AI researcher. Provide comprehensive research findings in a structured format.'
      },
      {
        role: 'user',
        content: ENHANCED_RESEARCH_PROMPT
      }
    ],
    temperature: 0.2,
    max_tokens: 4096
  };

  try {
    log.push(`📤 Sending text-based request to Poe API for model: ${model}`);
    
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
    const data = await response.json();
    
    log.push(`📥 Response received in ${responseTime}ms`);
    log.push(`📊 HTTP Status: ${response.status}`);
    
    if (!response.ok) {
      log.push(`❌ API Error: ${JSON.stringify(data)}`);
      return {
        model,
        success: false,
        responseTime,
        outputQuality: 0,
        supportsFunctionCalling: false,
        error: `HTTP ${response.status}: ${JSON.stringify(data)}`,
        fullLog: log
      };
    }

    const message = data.choices?.[0]?.message;
    const content = message?.content || '';
    
    if (content.length > 100) {
      log.push(`✅ Text response received successfully`);
      log.push(`📝 Content length: ${content.length} characters`);
      
      // Simple quality assessment based on content structure
      let qualityScore = 30; // Base score for any response
      if (content.includes('Technical Specifications') || content.includes('technical')) qualityScore += 15;
      if (content.includes('Educational') || content.includes('learning')) qualityScore += 15;
      if (content.includes('Implementation') || content.includes('code')) qualityScore += 15;
      if (content.includes('Community') || content.includes('resources')) qualityScore += 10;
      if (content.includes('Quality') || content.includes('score')) qualityScore += 10;
      if (content.length > 1000) qualityScore += 5;
      
      log.push(`📈 Estimated Quality Score: ${qualityScore}/100`);
      
      return {
        model,
        success: true,
        responseTime,
        outputQuality: qualityScore,
        supportsFunctionCalling: false,
        response: { content },
        fullLog: log
      };
    } else {
      log.push(`❌ Insufficient response content`);
      log.push(`📝 Content: ${content}`);
      
      return {
        model,
        success: false,
        responseTime,
        outputQuality: 0,
        supportsFunctionCalling: false,
        response: message,
        fullLog: log
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    log.push(`💥 Error: ${error.message}`);
    
    return {
      model,
      success: false,
      responseTime,
      outputQuality: 0,
      supportsFunctionCalling: false,
      error: error.message,
      fullLog: log
    };
  }
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Teacher Model Comparison Test');
  console.log(`🎯 Target Model: ${TARGET_MODEL_URL}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  
  const results: ModelTestResult[] = [];
  const masterLog: string[] = [];
  
  masterLog.push('# Teacher Model Comparison Test Log');
  masterLog.push(`**Target Model:** ${TARGET_MODEL_URL}`);
  masterLog.push(`**Test Date:** ${new Date().toISOString()}`);
  masterLog.push(`**Models Tested:** ${MODELS_TO_TEST.length}`);
  masterLog.push('');
  
  for (let i = 0; i < MODELS_TO_TEST.length; i++) {
    const model = MODELS_TO_TEST[i];
    console.log(`\n[${i + 1}/${MODELS_TO_TEST.length}] Testing ${model}...`);
    
    // First try function calling
    let result = await testModelWithFunctionCalling(model);
    
    // If function calling fails, try text parsing
    if (!result.success && result.error?.includes('does not support tool calling')) {
      console.log(`   Fallback to text parsing for ${model}...`);
      result = await testModelWithTextParsing(model);
    }
    
    results.push(result);
    
    // Log results
    const status = result.success ? '✅' : '❌';
    const fcSupport = result.supportsFunctionCalling ? '🔧' : '📝';
    console.log(`   ${status} ${fcSupport} ${model}: Quality ${result.outputQuality}/100 (${result.responseTime}ms)`);
    
    if (result.error) {
      console.log(`      Error: ${result.error}`);
    }
    
    // Add to master log
    masterLog.push(`## ${model}`);
    masterLog.push(`- **Status:** ${result.success ? 'Success' : 'Failed'}`);
    masterLog.push(`- **Function Calling:** ${result.supportsFunctionCalling ? 'Supported' : 'Not Supported'}`);
    masterLog.push(`- **Quality Score:** ${result.outputQuality}/100`);
    masterLog.push(`- **Response Time:** ${result.responseTime}ms`);
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
    if (i < MODELS_TO_TEST.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Generate summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const withFunctionCalling = results.filter(r => r.supportsFunctionCalling);
  const avgQuality = successful.length > 0 ? 
    successful.reduce((sum, r) => sum + r.outputQuality, 0) / successful.length : 0;
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  console.log(`🔧 Function Calling: ${withFunctionCalling.length}/${results.length}`);
  console.log(`📈 Average Quality: ${avgQuality.toFixed(1)}/100`);
  
  // Sort by quality
  const sortedResults = results.sort((a, b) => b.outputQuality - a.outputQuality);
  
  console.log('\n🏆 TOP PERFORMERS:');
  sortedResults.slice(0, 3).forEach((result, index) => {
    const medal = ['🥇', '🥈', '🥉'][index];
    const fcIcon = result.supportsFunctionCalling ? '🔧' : '📝';
    console.log(`${medal} ${result.model}: ${result.outputQuality}/100 ${fcIcon}`);
  });
  
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
      total_models: results.length,
      successful_models: successful.length,
      function_calling_models: withFunctionCalling.length,
      average_quality: avgQuality,
      success_rate: `${Math.round((successful.length / results.length) * 100)}%`
    },
    results: results,
    top_performers: sortedResults.slice(0, 5).map(r => ({
      model: r.model,
      quality: r.outputQuality,
      supports_function_calling: r.supportsFunctionCalling,
      response_time: r.responseTime
    }))
  };
  
  const resultsFile = join(outputDir, `teacher-model-comparison-${timestamp}.json`);
  writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
  
  // Save master log
  const logFile = join(outputDir, `teacher-model-test-log-${timestamp}.md`);
  writeFileSync(logFile, masterLog.join('\n'));
  
  // Save individual model outputs
  results.forEach(result => {
    if (result.success && result.response) {
      const modelFile = join(outputDir, `${result.model}-output-${timestamp}.json`);
      writeFileSync(modelFile, JSON.stringify({
        model: result.model,
        timestamp: new Date().toISOString(),
        quality_score: result.outputQuality,
        supports_function_calling: result.supportsFunctionCalling,
        response_time: result.responseTime,
        output: result.response
      }, null, 2));
    }
  });
  
  console.log(`\n💾 Results saved to: ${outputDir}`);
  console.log(`📄 Main results: teacher-model-comparison-${timestamp}.json`);
  console.log(`📋 Full log: teacher-model-test-log-${timestamp}.md`);
  console.log(`📁 Individual outputs: ${successful.length} model output files`);
  
  return results;
}

// Run the test
if (import.meta.main) {
  runComprehensiveTest()
    .then(results => {
      console.log('\n🎯 Test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
