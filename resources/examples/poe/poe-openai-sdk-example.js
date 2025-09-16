#!/usr/bin/env node

/**
 * ALAIn Poe Integration - OpenAI SDK Example
 * Corrected and enhanced version with multiple model support
 */

import { OpenAI } from "openai";

async function main() {
    // Initialize Poe client with OpenAI SDK
    const client = new OpenAI({
        apiKey: process.env.POE_API_KEY || "YOUR_POE_API_KEY",
        baseURL: "https://api.poe.com/v1",
    });

    console.log("🤖 ALAIn Poe Integration Test");
    console.log("=".repeat(50));

    try {
        // Test with GPT-OSS-20B
        console.log("\n🧪 Testing with GPT-OSS-20B...");
        const chat20B = await client.chat.completions.create({
            model: "GPT-OSS-20B", // Note: corrected syntax
            messages: [
                { role: "system", content: "You are a helpful AI assistant." },
                { role: "user", content: "Hello! Can you tell me about yourself?" }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        console.log("✅ GPT-OSS-20B Response:");
        console.log(chat20B.choices[0].message.content);

        // Test with GPT-OSS-120B
        console.log("\n🧪 Testing with GPT-OSS-120B...");
        const chat120B = await client.chat.completions.create({
            model: "GPT-OSS-120B", // Note: corrected syntax
            messages: [
                { role: "system", content: "You are a helpful AI assistant." },
                { role: "user", content: "What's the difference between GPT-OSS-20B and GPT-OSS-120B?" }
            ],
            temperature: 0.7,
            max_tokens: 150
        });

        console.log("✅ GPT-OSS-120B Response:");
        console.log(chat120B.choices[0].message.content);

        console.log("\n🎉 Both models working successfully!");

    } catch (error) {
        console.error("❌ Error:", error.message);

        if (error.message.includes("401")) {
            console.log("💡 Make sure your POE_API_KEY is correct");
        } else if (error.message.includes("404")) {
            console.log("💡 The model name might be incorrect. Available Poe models:");
            console.log("   - GPT-4o-mini");
            console.log("   - GPT-4o");
            console.log("   - Claude-3.5-Sonnet");
            console.log("   - Claude-3-Haiku");
            console.log("   - Gemini-1.5-Pro");
            console.log("   - And many others...");
        }
    }
}

// Helper function to test different models
async function testModel(client, modelName, prompt) {
    try {
        const response = await client.chat.completions.create({
            model: modelName,
            messages: [
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 100
        });

        console.log(`✅ ${modelName}: ${response.choices[0].message.content}`);
        return true;
    } catch (error) {
        console.log(`❌ ${modelName}: ${error.message}`);
        return false;
    }
}

// Test multiple models
async function testMultipleModels() {
    const client = new OpenAI({
        apiKey: process.env.POE_API_KEY || "YOUR_POE_API_KEY",
        baseURL: "https://api.poe.com/v1",
    });

    const modelsToTest = [
        "GPT-OSS-20B",
        "GPT-OSS-120B",
        "GPT-4o",
        "GPT-4o-mini",
        "Claude-3.5-Sonnet"
    ];

    console.log("\n🔍 Testing multiple Poe models:");
    console.log("-".repeat(40));

    for (const model of modelsToTest) {
        await testModel(client, model, `Hello from ${model}!`);
    }
}

// Export functions for use in other files
export {
    main,
    testMultipleModels,
    testModel
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().then(() => {
        console.log("\n" + "=".repeat(50));
        console.log("Want to test multiple models?");
        console.log("Run: node poe-openai-sdk-example.js --test-all");
        console.log("=".repeat(50));

        // Check for command line arguments
        if (process.argv.includes("--test-all")) {
            return testMultipleModels();
        }
    }).catch(console.error);
}
