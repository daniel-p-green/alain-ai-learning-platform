#!/usr/bin/env node

/**
 * ALAIn Poe Integration Test Script
 * Tests Poe API connectivity using different methods
 */

import https from 'https';
import { OpenAI } from 'openai';

// Get API key from environment
const POE_API_KEY = process.env.POE_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!POE_API_KEY) {
    console.error('❌ POE_API_KEY environment variable not set');
    console.log('Get your key from: https://poe.com/api_key');
    process.exit(1);
}

console.log('🧪 Testing ALAIn Poe Integration\n');

// Test 1: Direct HTTP call (current implementation style)
function testDirectHTTP() {
    return new Promise((resolve, reject) => {
        console.log('1️⃣ Testing Direct HTTP Call...');

        const payload = JSON.stringify({
            model: 'GPT-4o-mini',
            messages: [
                { role: 'user', content: 'Hello! Respond with just "Poe test successful" if you can read this.' }
            ],
            temperature: 0.7,
            max_tokens: 50
        });

        const options = {
            hostname: 'api.poe.com',
            port: 443,
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${POE_API_KEY}`,
                'Content-Type': 'application/json',
                'User-Agent': 'ALAIN-Test/1.0',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    if (response.choices && response.choices[0]) {
                        console.log('✅ Direct HTTP: SUCCESS');
                        console.log('Response:', response.choices[0].message.content);
                    } else {
                        console.log('❌ Direct HTTP: Failed - No choices in response');
                        console.log('Full response:', data);
                    }
                    resolve();
                } catch (e) {
                    console.log('❌ Direct HTTP: Failed to parse response');
                    console.log('Raw response:', data);
                    resolve();
                }
            });
        });

        req.on('error', (e) => {
            console.log('❌ Direct HTTP: Network error -', e.message);
            resolve();
        });

        req.write(payload);
        req.end();
    });
}

// Test 2: OpenAI SDK with Poe endpoint (recommended approach)
async function testOpenAISDK() {
    console.log('\n2️⃣ Testing OpenAI SDK with Poe...');

    try {
        const client = new OpenAI({
            apiKey: POE_API_KEY,
            baseURL: 'https://api.poe.com/v1',
        });

        const response = await client.chat.completions.create({
            model: 'GPT-4o-mini',
            messages: [
                { role: 'user', content: 'This is a test from ALAIn platform. Say "OpenAI SDK test successful!"' }
            ],
            temperature: 0.7,
            max_tokens: 50,
        });

        console.log('✅ OpenAI SDK: SUCCESS');
        console.log('Response:', response.choices[0].message.content);

    } catch (error) {
        console.log('❌ OpenAI SDK: FAILED');
        console.log('Error:', error.message);

        if (error.message.includes('401')) {
            console.log('💡 Tip: Check your POE_API_KEY is correct');
        } else if (error.message.includes('429')) {
            console.log('💡 Tip: You may have exceeded rate limits');
        }
    }
}

// Test 3: Compare with regular OpenAI (if available)
async function testRegularOpenAI() {
    if (!OPENAI_API_KEY) {
        console.log('\n3️⃣ Skipping OpenAI comparison (no OPENAI_API_KEY set)');
        return;
    }

    console.log('\n3️⃣ Testing Regular OpenAI for comparison...');

    try {
        const client = new OpenAI({
            apiKey: OPENAI_API_KEY,
        });

        const response = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'user', content: 'This is a comparison test. Say "Regular OpenAI works!"' }
            ],
            temperature: 0.7,
            max_tokens: 50,
        });

        console.log('✅ Regular OpenAI: SUCCESS');
        console.log('Response:', response.choices[0].message.content);

    } catch (error) {
        console.log('❌ Regular OpenAI: FAILED');
        console.log('Error:', error.message);
    }
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Poe Integration Tests for ALAIn\n');

    // Test 1: Direct HTTP
    await testDirectHTTP();

    // Test 2: OpenAI SDK
    await testOpenAISDK();

    // Test 3: Regular OpenAI comparison
    await testRegularOpenAI();

    // Test 4: GPT-OSS teacher models
    await testGPTOSSModels();

// Test 4: Test GPT-OSS models specifically
async function testGPTOSSModels() {
    console.log('\n4️⃣ Testing GPT-OSS Teacher Models...');

    const modelsToTest = ['GPT-OSS-20B', 'GPT-OSS-120B'];

    for (const model of modelsToTest) {
        try {
            console.log(`\n🧪 Testing ${model}...`);

            const response = await client.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: 'user',
                        content: `You are ALAIN's teacher AI. Respond with: "Hello! I am ${model}, ready to help generate AI learning content for ALAIN platform."`
                    }
                ],
                temperature: 0.7,
                max_tokens: 100,
            });

            console.log(`✅ ${model}: SUCCESS`);
            console.log('Response:', response.choices[0].message.content);

        } catch (error) {
            console.log(`❌ ${model}: FAILED`);
            console.log('Error:', error.message);

            if (error.message.includes('404')) {
                console.log(`💡 Tip: ${model} may not be available through Poe API`);
            }
        }
    }
}

console.log('\n🎉 Tests completed!');
console.log('\n📚 Next steps:');
console.log('- If Direct HTTP works but OpenAI SDK fails: Check OpenAI SDK version (needs v4+)');
console.log('- If both fail: Verify POE_API_KEY is correct');
console.log('- If GPT-OSS models fail: They may not be available through Poe API');
console.log('- For production: Use OpenAI SDK approach for better error handling and streaming');
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
ALAIn Poe Integration Test Script

Usage:
  node test-poe-integration.js

Environment Variables:
  POE_API_KEY     - Required: Your Poe API key
  OPENAI_API_KEY  - Optional: For comparison testing

Examples:
  POE_API_KEY=your_key_here node test-poe-integration.js
  POE_API_KEY=your_key_here OPENAI_API_KEY=your_openai_key node test-poe-integration.js
`);
    process.exit(0);
}

runTests().catch(console.error);
