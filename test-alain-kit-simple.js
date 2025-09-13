#!/usr/bin/env node

/**
 * Simple ALAIN-Kit Test for LM Studio
 * Quick test to verify the setup works
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LM_STUDIO_URL = 'http://localhost:1234/v1';

async function quickTest() {
  console.log('🧪 Quick ALAIN-Kit Test with LM Studio\n');
  
  // Test 1: Check LM Studio connection
  console.log('1️⃣ Testing LM Studio connection...');
  try {
    const response = await fetch(`${LM_STUDIO_URL}/models`);
    const models = await response.json();
    console.log('✅ LM Studio is running');
    console.log(`📋 Models available: ${models.data?.length || 0}`);
  } catch (error) {
    console.log('❌ LM Studio not accessible:', error.message);
    console.log('💡 Make sure LM Studio is running on http://localhost:1234');
    return;
  }
  
  // Test 2: Load a Harmony prompt
  console.log('\n2️⃣ Testing Harmony prompt loading...');
  try {
    const promptPath = path.join(__dirname, 'prompts', 'alain-kit', 'research.harmony.txt');
    const content = fs.readFileSync(promptPath, 'utf8');
    console.log('✅ Harmony prompt loaded');
    console.log(`📄 Content length: ${content.length} chars`);
    
    // Extract system message
    const systemMatch = content.match(/<\|start\|>system<\|message\|>(.*?)<\|end\|>/s);
    if (systemMatch) {
      console.log(`🔧 System message: ${systemMatch[1].trim().length} chars`);
    }
  } catch (error) {
    console.log('❌ Failed to load Harmony prompt:', error.message);
    return;
  }
  
  // Test 3: Simple API call
  console.log('\n3️⃣ Testing simple API call...');
  try {
    const response = await fetch(`${LM_STUDIO_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'GPT-OSS-20B',
        messages: [
          { role: 'user', content: 'Hello! Can you help me test the ALAIN-Kit system?' }
        ],
        max_tokens: 100
      })
    });
    
    const result = await response.json();
    
    // Debug: Log the full response structure
    console.log('📋 Full API response:', JSON.stringify(result, null, 2));
    
    const content = result.choices?.[0]?.message?.content || 'No response';
    
    console.log('✅ API call successful');
    console.log(`🤖 Response: ${content.substring(0, 100)}...`);
    
  } catch (error) {
    console.log('❌ API call failed:', error.message);
  }
  
  console.log('\n🎉 Quick test completed!');
}

quickTest().catch(console.error);
