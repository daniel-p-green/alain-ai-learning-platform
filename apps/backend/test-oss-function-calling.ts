#!/usr/bin/env bun

/**
 * Test script to verify function calling support for GPT-OSS models via Poe API
 */

interface TestResult {
  model: string;
  supportsFunctionCalling: boolean;
  error?: string;
  response?: any;
}

async function testModelFunctionCalling(model: string): Promise<TestResult> {
  const startTime = Date.now();
  console.log(`🧪 Testing function calling for model: ${model}`);
  
  const poeApiKey = process.env.POE_API_KEY;
  if (!poeApiKey) {
    throw new Error('POE_API_KEY environment variable is not set');
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
      function: {
        name: 'test_function',
        description: 'A simple test function',
        parameters: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            number: { type: 'number' }
          },
          required: ['message', 'number']
        }
      }
    }],
    temperature: 0.1,
    max_tokens: 1000
  };

  try {
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${poeApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ALAIN-Research/1.0'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ ${model}: API Error - ${JSON.stringify(data)}`);
      return {
        model,
        supportsFunctionCalling: false,
        error: `HTTP ${response.status}: ${JSON.stringify(data)}`,
        response: data
      };
    }

    const message = data.choices?.[0]?.message;
    const hasFunctionCall = message?.tool_calls?.[0]?.function?.name === 'test_function';
    
    if (hasFunctionCall) {
      console.log(`✅ ${model}: Function calling SUPPORTED`);
      return {
        model,
        supportsFunctionCalling: true,
        response: message.tool_calls[0].function
      };
    } else {
      console.log(`❌ ${model}: Function calling NOT SUPPORTED`);
      return {
        model,
        supportsFunctionCalling: false,
        response: message
      };
    }
  } catch (error) {
    console.error(`💥 ${model}: Error - ${error.message}`);
    return {
      model,
      supportsFunctionCalling: false,
      error: error.message,
      response: error
    };
  }
}

async function runTests() {
  console.log('🔍 Testing GPT-OSS Model Function Calling via Poe API\n');
  
  const models = [
    'gpt-oss-20b',
    'gpt-oss-120b',
    'gpt-4-turbo' // Control model that we know works
  ];

  const results: TestResult[] = [];
  
  for (const model of models) {
    const result = await testModelFunctionCalling(model);
    results.push(result);
    
    // Add delay between tests to avoid rate limiting
    if (model !== models[models.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Print summary
  console.log('\n📊 TEST RESULTS');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.supportsFunctionCalling ? '✅' : '❌';
    console.log(`${status} ${result.model}: ${result.supportsFunctionCalling ? 'SUPPORTS' : 'DOES NOT SUPPORT'} function calling`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
}

// Run the tests
if (import.meta.main) {
  runTests().catch(console.error);
}
