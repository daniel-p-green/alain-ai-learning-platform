#!/usr/bin/env bun

/**
 * Test script to investigate which models support function calling via Poe API
 * This will help us understand model capabilities for ALAIN-Kit research phase
 */

import { readFileSync } from 'fs';
import { join } from 'path';

interface FunctionCallTest {
  model: string;
  supportsFunction: boolean;
  error?: string;
  responseTime?: number;
  quality?: number;
}

const MODELS_TO_TEST = [
  // OpenAI-family on Poe
  'gpt-4-turbo',
  'GPT-4o',
  // GPT-OSS family (critical to ALAIN)
  'GPT-OSS-20B',
  'gpt-oss-20b', // test both casings
  'GPT-OSS-120B',
];

const SIMPLE_FUNCTION_SCHEMA = {
  name: 'test_function',
  description: 'A simple test function to check function calling support',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'A simple message to return'
      },
      number: {
        type: 'number', 
        description: 'A test number'
      }
    },
    required: ['message', 'number']
  }
};

async function testModelFunctionCalling(model: string): Promise<FunctionCallTest> {
  const startTime = Date.now();
  
  try {
    console.log(`🧪 Testing function calling for model: ${model}`);
    
    const poeApiKey = process.env.POE_API_KEY;
    if (!poeApiKey) {
      throw new Error('POE_API_KEY not set');
    }

    const payload = {
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Use the provided function to respond.'
        },
        {
          role: 'user', 
          content: 'Please call the test_function with message "Hello World" and number 42.'
        }
      ],
      tools: [{
        type: 'function',
        function: SIMPLE_FUNCTION_SCHEMA
      }],
      temperature: 0.1,
      max_tokens: 1000
    };

    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${poeApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;
    
    // Check if the response contains function calls
    const message = data.choices?.[0]?.message;
    const hasFunctionCall = Array.isArray(message?.tool_calls) && message.tool_calls.length > 0;
    
    if (hasFunctionCall) {
      const functionCall = message.tool_calls[0];
      const args = JSON.parse(functionCall.function.arguments);
      
      console.log(`✅ ${model}: Function calling SUPPORTED`);
      console.log(`   Function: ${functionCall.function.name}`);
      console.log(`   Args: ${JSON.stringify(args)}`);
      
      return {
        model,
        supportsFunction: true,
        responseTime,
        quality: args.message === 'Hello World' && args.number === 42 ? 100 : 75
      };
    } else {
      console.log(`❌ ${model}: Function calling NOT SUPPORTED`);
      console.log(`   Response: ${message?.content || 'No content'}`);
      
      return {
        model,
        supportsFunction: false,
        responseTime,
        quality: 0
      };
    }
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(`💥 ${model}: ERROR - ${error.message}`);
    
    return {
      model,
      supportsFunction: false,
      error: error.message,
      responseTime
    };
  }
}

async function runFunctionCallTests() {
  console.log('🔬 Starting Function Calling Model Tests');
  console.log('='.repeat(50));
  
  const results: FunctionCallTest[] = [];
  
  for (const model of MODELS_TO_TEST) {
    const result = await testModelFunctionCalling(model);
    results.push(result);
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 FUNCTION CALLING TEST RESULTS');
  console.log('='.repeat(50));
  
  const supportedModels = results.filter(r => r.supportsFunction);
  const unsupportedModels = results.filter(r => !r.supportsFunction);
  
  console.log(`\n✅ MODELS WITH FUNCTION CALLING SUPPORT (${supportedModels.length}):`);
  supportedModels.forEach(result => {
    console.log(`   ${result.model} - Quality: ${result.quality}% - Time: ${result.responseTime}ms`);
  });
  
  console.log(`\n❌ MODELS WITHOUT FUNCTION CALLING SUPPORT (${unsupportedModels.length}):`);
  unsupportedModels.forEach(result => {
    const errorInfo = result.error ? ` (${result.error})` : '';
    console.log(`   ${result.model}${errorInfo}`);
  });
  
  // Save detailed results
  const timestamp = Date.now();
  const outputPath = `research-outputs/function-calling-test-results-${timestamp}.json`;
  
  const detailedResults = {
    timestamp: new Date().toISOString(),
    test_summary: {
      total_models: MODELS_TO_TEST.length,
      supported_models: supportedModels.length,
      unsupported_models: unsupportedModels.length,
      success_rate: `${Math.round((supportedModels.length / MODELS_TO_TEST.length) * 100)}%`
    },
    results: results,
    recommendations: {
      best_for_alain_kit: supportedModels
        .sort((a, b) => (b.quality || 0) - (a.quality || 0))
        .slice(0, 3)
        .map(r => r.model),
      fallback_models: unsupportedModels.map(r => r.model)
    }
  };
  
  await Bun.write(outputPath, JSON.stringify(detailedResults, null, 2));
  console.log(`\n💾 Detailed results saved to: ${outputPath}`);
  
  return results;
}

// Run the tests
if (import.meta.main) {
  runFunctionCallTests()
    .then(results => {
      console.log('\n🎯 Test completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}
