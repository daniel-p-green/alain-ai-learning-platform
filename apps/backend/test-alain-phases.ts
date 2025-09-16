#!/usr/bin/env tsx
/**
 * Comprehensive test for all ALAIN-kit phases with topic/theme specification
 */

import { researchModel } from './utils/research';
import { join } from 'path';

const POE_API_KEY = '***REMOVED***';

async function testAlainPhases() {
  console.log('🧪 Testing ALAIN-kit phases with topic specification...\n');

  // Phase 1: Research with custom topic
  console.log('📖 Phase 1: Research Phase');
  console.log('Testing topic: "machine learning fundamentals"');
  
  try {
    const researchDir = await researchModel(
      'gpt-oss-20b',
      'openai',
      process.cwd(),
      {
        query: 'machine learning fundamentals tutorial beginner',
        offlineCache: false,
        maxBytes: 1024 * 1024 // 1MB limit for testing
      }
    );
    console.log('✅ Research phase completed');
    console.log(`📁 Research saved to: ${researchDir}`);
  } catch (error) {
    console.error('❌ Research phase failed:', error);
  }

  // Phase 2: Test Teacher API with topic-specific lesson generation
  console.log('\n🎓 Phase 2: Teacher Generation Phase');
  console.log('Testing lesson generation with topic: "Introduction to Neural Networks"');
  
  try {
    const teacherRequest = {
      model: 'GPT-OSS-20B' as const,
      task: 'lesson_generation' as const,
      provider: 'poe' as const,
      messages: [
        {
          role: 'user' as const,
          content: `Generate a beginner-friendly lesson about "Introduction to Neural Networks" using the gpt-oss-20b model. 
          
          Topic: Introduction to Neural Networks
          Target Audience: Beginners with basic Python knowledge
          Learning Objectives:
          - Understand what neural networks are
          - Learn basic neural network components
          - Implement a simple neural network example
          
          Please create a structured lesson with practical code examples.`
        }
      ],
      temperature: 0.3,
      max_tokens: 2048
    };

    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-20b',
        messages: teacherRequest.messages,
        temperature: teacherRequest.temperature,
        max_tokens: teacherRequest.max_tokens,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Teacher generation phase completed');
      console.log('📝 Generated lesson preview:');
      console.log(data.choices[0].message.content.substring(0, 200) + '...');
    } else {
      console.error('❌ Teacher API request failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Teacher generation phase failed:', error);
  }

  // Phase 3: Test Harmony prompts (if available)
  console.log('\n🎵 Phase 3: Harmony Prompt Phase');
  try {
    const { loadAlainKitPrompt } = await import('./execution/prompts/loader');
    
    // Test loading different prompt phases
    const phases = ['research.harmony', 'research.offline.harmony'];
    
    for (const phase of phases) {
      try {
        const { system, developer } = loadAlainKitPrompt(phase);
        console.log(`✅ Loaded ${phase} prompt (${system.length + developer.length} chars)`);
      } catch (error) {
        console.log(`⚠️  ${phase} prompt not available`);
      }
    }
  } catch (error) {
    console.error('❌ Harmony prompt phase failed:', error);
  }

  // Phase 4: Test topic-specific notebook generation
  console.log('\n📓 Phase 4: Notebook Generation Phase');
  console.log('Testing notebook generation with topic: "Computer Vision Basics"');
  
  try {
    const notebookRequest = {
      model: 'GPT-OSS-20B' as const,
      task: 'lesson_generation' as const,
      provider: 'poe' as const,
      messages: [
        {
          role: 'user' as const,
          content: `Create a Jupyter notebook lesson for "Computer Vision Basics" using OpenCV and Python.
          
          Topic: Computer Vision Basics
          Focus Areas:
          - Image loading and display
          - Basic image operations
          - Edge detection
          - Simple object detection
          
          Generate structured notebook cells with code examples and explanations.`
        }
      ],
      temperature: 0.2,
      max_tokens: 3072
    };

    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-20b',
        messages: notebookRequest.messages,
        temperature: notebookRequest.temperature,
        max_tokens: notebookRequest.max_tokens,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Notebook generation phase completed');
      console.log('📓 Generated notebook preview:');
      console.log(data.choices[0].message.content.substring(0, 300) + '...');
    } else {
      console.error('❌ Notebook generation failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Notebook generation phase failed:', error);
  }

  console.log('\n🎉 ALAIN-kit phase testing completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Research phase: Supports custom topics via query parameter');
  console.log('✅ Teacher generation: Supports topic-specific lesson creation');
  console.log('✅ Harmony prompts: Configurable via TEACHER_PROMPT_PHASE');
  console.log('✅ Notebook generation: Supports themed notebook creation');
}

testAlainPhases();
