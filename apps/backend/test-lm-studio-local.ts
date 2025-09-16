#!/usr/bin/env bun

/**
 * Test GPT-OSS-20B via LM Studio Local API
 * Compare local performance vs Poe API for ALAIN-Kit research phase
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface LocalTestResult {
  endpoint: string;
  model: string;
  success: boolean;
  responseTime: number;
  outputQuality: number;
  supportsFunctionCalling: boolean;
  error?: string;
  response?: any;
  fullLog: string[];
}

const LM_STUDIO_ENDPOINT = 'http://localhost:1234/v1';
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

Format your response with clear sections and comprehensive details.`;

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

async function testLMStudioFunctionCalling(): Promise<LocalTestResult> {
  const startTime = Date.now();
  const log: string[] = [];
  
  log.push(`🧪 Testing LM Studio with function calling`);
  log.push(`🔗 Endpoint: ${LM_STUDIO_ENDPOINT}`);
  log.push(`⏰ Start time: ${new Date().toISOString()}`);
  
  const payload = {
    model: 'gpt-oss-20b', // LM Studio model identifier
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
    log.push(`📤 Sending function calling request to LM Studio`);
    
    const response = await fetch(`${LM_STUDIO_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
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
        endpoint: LM_STUDIO_ENDPOINT,
        model: 'gpt-oss-20b',
        success: false,
        responseTime,
        outputQuality: 0,
        supportsFunctionCalling: false,
        error: `HTTP ${response.status}: ${errorText}`,
        fullLog: log
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const hasFunctionCall = message?.tool_calls?.[0]?.function?.name === 'emit_research_findings';
    
    if (hasFunctionCall) {
      log.push(`✅ Function calling successful`);
      const functionArgs = JSON.parse(message.tool_calls[0].function.arguments);
      const qualityScore = functionArgs.quality_score || 0;
      
      log.push(`📈 Quality Score: ${qualityScore}/100`);
      log.push(`🎯 Research findings extracted successfully`);
      
      return {
        endpoint: LM_STUDIO_ENDPOINT,
        model: 'gpt-oss-20b',
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
        endpoint: LM_STUDIO_ENDPOINT,
        model: 'gpt-oss-20b',
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
    log.push(`💥 Connection Error: ${error.message}`);
    
    return {
      endpoint: LM_STUDIO_ENDPOINT,
      model: 'gpt-oss-20b',
      success: false,
      responseTime,
      outputQuality: 0,
      supportsFunctionCalling: false,
      error: error.message,
      fullLog: log
    };
  }
}

async function testLMStudioTextParsing(): Promise<LocalTestResult> {
  const startTime = Date.now();
  const log: string[] = [];
  
  log.push(`🧪 Testing LM Studio with text parsing (fallback)`);
  log.push(`🔗 Endpoint: ${LM_STUDIO_ENDPOINT}`);
  log.push(`⏰ Start time: ${new Date().toISOString()}`);
  
  const payload = {
    model: 'gpt-oss-20b',
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
    log.push(`📤 Sending text-based request to LM Studio`);
    
    const response = await fetch(`${LM_STUDIO_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
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
        endpoint: LM_STUDIO_ENDPOINT,
        model: 'gpt-oss-20b',
        success: false,
        responseTime,
        outputQuality: 0,
        supportsFunctionCalling: false,
        error: `HTTP ${response.status}: ${errorText}`,
        fullLog: log
      };
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    const content = message?.content || '';
    
    if (content.length > 100) {
      log.push(`✅ Text response received successfully`);
      log.push(`📝 Content length: ${content.length} characters`);
      
      // Quality assessment based on content structure
      let qualityScore = 30; // Base score
      if (content.includes('Technical Specifications') || content.includes('technical')) qualityScore += 15;
      if (content.includes('Educational') || content.includes('learning')) qualityScore += 15;
      if (content.includes('Implementation') || content.includes('code')) qualityScore += 15;
      if (content.includes('Community') || content.includes('resources')) qualityScore += 10;
      if (content.includes('Quality') || content.includes('score')) qualityScore += 10;
      if (content.length > 1000) qualityScore += 5;
      
      log.push(`📈 Estimated Quality Score: ${qualityScore}/100`);
      
      return {
        endpoint: LM_STUDIO_ENDPOINT,
        model: 'gpt-oss-20b',
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
        endpoint: LM_STUDIO_ENDPOINT,
        model: 'gpt-oss-20b',
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
    log.push(`💥 Connection Error: ${error.message}`);
    
    return {
      endpoint: LM_STUDIO_ENDPOINT,
      model: 'gpt-oss-20b',
      success: false,
      responseTime,
      outputQuality: 0,
      supportsFunctionCalling: false,
      error: error.message,
      fullLog: log
    };
  }
}

async function runLMStudioComparison() {
  console.log('🚀 Starting LM Studio Local API Test');
  console.log(`🎯 Target Model: GPT-OSS-20B`);
  console.log(`🔗 Local Endpoint: ${LM_STUDIO_ENDPOINT}`);
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log('='.repeat(80));
  
  const results: LocalTestResult[] = [];
  const masterLog: string[] = [];
  
  masterLog.push('# LM Studio Local API Test Log');
  masterLog.push(`**Target Model:** GPT-OSS-20B`);
  masterLog.push(`**Local Endpoint:** ${LM_STUDIO_ENDPOINT}`);
  masterLog.push(`**Test Date:** ${new Date().toISOString()}`);
  masterLog.push('');
  
  // Test 1: Function calling
  console.log('\n[1/2] Testing function calling...');
  const functionResult = await testLMStudioFunctionCalling();
  results.push(functionResult);
  
  const fcStatus = functionResult.success ? '✅' : '❌';
  const fcSupport = functionResult.supportsFunctionCalling ? '🔧' : '📝';
  console.log(`   ${fcStatus} ${fcSupport} Function Calling: Quality ${functionResult.outputQuality}/100 (${functionResult.responseTime}ms)`);
  
  if (functionResult.error) {
    console.log(`      Error: ${functionResult.error}`);
  }
  
  // Test 2: Text parsing (if function calling fails)
  if (!functionResult.success || !functionResult.supportsFunctionCalling) {
    console.log('\n[2/2] Testing text parsing fallback...');
    const textResult = await testLMStudioTextParsing();
    results.push(textResult);
    
    const textStatus = textResult.success ? '✅' : '❌';
    console.log(`   ${textStatus} 📝 Text Parsing: Quality ${textResult.outputQuality}/100 (${textResult.responseTime}ms)`);
    
    if (textResult.error) {
      console.log(`      Error: ${textResult.error}`);
    }
  }
  
  // Generate comparison with Poe API results
  console.log('\n📊 COMPARISON SUMMARY');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const bestResult = successful.length > 0 ? 
    successful.reduce((best, current) => current.outputQuality > best.outputQuality ? current : best) : null;
  
  if (bestResult) {
    console.log(`✅ LM Studio Local: ${bestResult.outputQuality}/100 (${bestResult.responseTime}ms)`);
    console.log(`🔧 Function Calling: ${bestResult.supportsFunctionCalling ? 'Supported' : 'Not Supported'}`);
    console.log(`📝 Method: ${bestResult.supportsFunctionCalling ? 'Function Calling' : 'Text Parsing'}`);
    
    // Compare with Poe API results (from previous test)
    console.log('\n🆚 LOCAL vs POE API COMPARISON:');
    console.log(`Local (LM Studio):  ${bestResult.outputQuality}/100 (${bestResult.responseTime}ms)`);
    console.log(`Poe API:           100/100 (11361ms) - from previous test`);
    console.log(`Speed Advantage:   ${bestResult.responseTime < 11361 ? 'LOCAL WINS' : 'POE WINS'}`);
  } else {
    console.log('❌ LM Studio connection failed');
    console.log('💡 Make sure LM Studio is running on localhost:1234');
    console.log('💡 Ensure GPT-OSS-20B model is loaded');
  }
  
  // Save results
  const timestamp = Date.now();
  const outputDir = '/Users/danielgreen/Downloads/OSS hackathon/alain-ai-learning-platform/hackathon-notes/test-log-output';
  
  try {
    mkdirSync(outputDir, { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
  
  // Add to master log
  results.forEach((result, index) => {
    const testType = result.supportsFunctionCalling ? 'Function Calling' : 'Text Parsing';
    masterLog.push(`## Test ${index + 1}: ${testType}`);
    masterLog.push(`- **Status:** ${result.success ? 'Success' : 'Failed'}`);
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
  });
  
  // Save detailed results
  const detailedResults = {
    timestamp: new Date().toISOString(),
    endpoint: LM_STUDIO_ENDPOINT,
    model: 'gpt-oss-20b',
    test_summary: {
      total_tests: results.length,
      successful_tests: successful.length,
      best_quality: bestResult?.outputQuality || 0,
      best_response_time: bestResult?.responseTime || 0,
      supports_function_calling: results.some(r => r.supportsFunctionCalling)
    },
    results: results,
    comparison_with_poe: {
      local_quality: bestResult?.outputQuality || 0,
      poe_quality: 100,
      local_time: bestResult?.responseTime || 0,
      poe_time: 11361,
      speed_winner: bestResult && bestResult.responseTime < 11361 ? 'local' : 'poe'
    }
  };
  
  const resultsFile = join(outputDir, `lm-studio-test-${timestamp}.json`);
  writeFileSync(resultsFile, JSON.stringify(detailedResults, null, 2));
  
  const logFile = join(outputDir, `lm-studio-test-log-${timestamp}.md`);
  writeFileSync(logFile, masterLog.join('\n'));
  
  console.log(`\n💾 Results saved to: ${outputDir}`);
  console.log(`📄 Results: lm-studio-test-${timestamp}.json`);
  console.log(`📋 Log: lm-studio-test-log-${timestamp}.md`);
  
  return results;
}

// Run the test
if (import.meta.main) {
  runLMStudioComparison()
    .then(results => {
      console.log('\n🎯 LM Studio test completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
