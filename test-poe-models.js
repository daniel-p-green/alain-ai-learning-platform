#!/usr/bin/env node

// Test script to check which models are available on Poe
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.POE_API_KEY || 'qZB4vYDsDMytPrL9t4N4SGi_M56X_b0vst0l1fuJu9s',
  baseURL: 'https://api.poe.com/v1',
});

const modelsToTest = [
  'GPT-OSS-20B',
  'GPT-OSS-120B', 
  'Claude-Sonnet-4',
  'Claude-Opus-4.1',
  'Gemini-2.5-Pro',
  'GPT-4o',
  'GPT-4o-mini',
  'Grok-4',
  'Llama-3.1-405B'
];

async function testModel(modelName) {
  try {
    console.log(`Testing ${modelName}...`);
    
    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'user', content: 'Say "Hello from ' + modelName + '"' }
      ],
      max_tokens: 10,
      temperature: 0
    });
    
    console.log(`✅ ${modelName}: ${response.choices[0]?.message?.content || 'No content'}`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing Poe API models...\n');
  
  const results = {};
  for (const model of modelsToTest) {
    results[model] = await testModel(model);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit
  }
  
  console.log('\n=== RESULTS ===');
  const working = Object.entries(results).filter(([_, works]) => works);
  const broken = Object.entries(results).filter(([_, works]) => !works);
  
  console.log('\n✅ Working models:');
  working.forEach(([model]) => console.log(`  - ${model}`));
  
  console.log('\n❌ Broken models:');
  broken.forEach(([model]) => console.log(`  - ${model}`));
  
  console.log(`\nTotal: ${working.length}/${modelsToTest.length} models working`);
}

main().catch(console.error);
