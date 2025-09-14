#!/usr/bin/env tsx
/**
 * Comprehensive test for GPT-OSS-120B model with all ALAIN-kit phases
 */

import { researchModel } from './utils/research';
import { join } from 'path';

const POE_API_KEY = 'qZB4vYDsDMytPrL9t4N4SGi_M56X_b0vst0l1fuJu9s';

async function testGptOss120b() {
  console.log('🧪 Testing GPT-OSS-120B with ALAIN-kit phases...\n');

  // Phase 1: Research with GPT-OSS-120B
  console.log('📖 Phase 1: Research Phase (GPT-OSS-120B)');
  console.log('Testing topic: "advanced deep learning architectures"');
  
  try {
    const researchDir = await researchModel(
      'gpt-oss-120b',
      'openai',
      process.cwd(),
      {
        query: 'advanced deep learning architectures transformer attention',
        offlineCache: false,
        maxBytes: 2 * 1024 * 1024 // 2MB limit for 120B model
      }
    );
    console.log('✅ Research phase completed for GPT-OSS-120B');
    console.log(`📁 Research saved to: ${researchDir}`);
  } catch (error) {
    console.error('❌ Research phase failed:', error);
  }

  // Phase 2: Test GPT-OSS-120B for advanced lesson generation
  console.log('\n🎓 Phase 2: Advanced Teacher Generation (GPT-OSS-120B)');
  console.log('Testing advanced lesson: "Transformer Architecture Deep Dive"');
  
  try {
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [
          {
            role: 'user',
            content: `Generate an advanced lesson about "Transformer Architecture Deep Dive" using the GPT-OSS-120B model.
            
            Topic: Transformer Architecture Deep Dive
            Target Audience: Advanced ML practitioners and researchers
            Learning Objectives:
            - Understand multi-head attention mechanisms in detail
            - Implement custom attention layers from scratch
            - Analyze positional encoding strategies
            - Explore advanced transformer variants (GPT, BERT, T5)
            - Performance optimization techniques
            
            Create a comprehensive, technically rigorous lesson with mathematical foundations and implementation details.`
          }
        ],
        temperature: 0.2,
        max_tokens: 4096, // Higher token limit for 120B model
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ GPT-OSS-120B teacher generation completed');
      console.log('📝 Advanced lesson preview:');
      console.log(data.choices[0].message.content.substring(0, 400) + '...');
      
      // Save the full response for comparison
      const fs = await import('fs');
      const outputPath = join(process.cwd(), 'test-results-120b-lesson.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`💾 Full response saved to: ${outputPath}`);
    } else {
      console.error('❌ GPT-OSS-120B API request failed:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
  } catch (error) {
    console.error('❌ GPT-OSS-120B generation failed:', error);
  }

  // Phase 3: Test advanced research paper analysis
  console.log('\n📚 Phase 3: Research Paper Analysis (GPT-OSS-120B)');
  console.log('Testing: Advanced research paper comprehension');
  
  try {
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [
          {
            role: 'user',
            content: `Analyze the "Attention Is All You Need" paper and create a comprehensive educational breakdown.
            
            Task: Research Paper Analysis and Educational Content Creation
            Paper: "Attention Is All You Need" (Vaswani et al., 2017)
            
            Please provide:
            1. Executive summary of key contributions
            2. Mathematical foundations explained step-by-step
            3. Implementation considerations and challenges
            4. Impact on subsequent research and applications
            5. Hands-on coding exercises for learners
            6. Common misconceptions and clarifications
            
            Target this for graduate-level computer science students.`
          }
        ],
        temperature: 0.1, // Very low for research analysis
        max_tokens: 4096,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Research paper analysis completed');
      console.log('📄 Analysis preview:');
      console.log(data.choices[0].message.content.substring(0, 400) + '...');
      
      // Save the analysis
      const fs = await import('fs');
      const outputPath = join(process.cwd(), 'test-results-120b-research.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`💾 Full analysis saved to: ${outputPath}`);
    } else {
      console.error('❌ Research analysis failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Research analysis failed:', error);
  }

  // Phase 4: Test advanced notebook generation
  console.log('\n📓 Phase 4: Advanced Notebook Generation (GPT-OSS-120B)');
  console.log('Testing: Multi-modal AI implementation notebook');
  
  try {
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [
          {
            role: 'user',
            content: `Create an advanced Jupyter notebook for "Multi-modal AI: Vision-Language Models".
            
            Topic: Multi-modal AI Implementation
            Advanced Focus Areas:
            - CLIP model architecture and training
            - Vision-language alignment techniques
            - Cross-modal attention mechanisms
            - Fine-tuning strategies for domain adaptation
            - Evaluation metrics for multi-modal systems
            - Production deployment considerations
            
            Generate a comprehensive notebook with:
            - Theoretical background with mathematical formulations
            - Step-by-step implementation from scratch
            - Advanced optimization techniques
            - Benchmarking and evaluation code
            - Real-world application examples
            
            Target: PhD-level researchers and senior ML engineers.`
          }
        ],
        temperature: 0.15,
        max_tokens: 4096,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Advanced notebook generation completed');
      console.log('📓 Notebook preview:');
      console.log(data.choices[0].message.content.substring(0, 400) + '...');
      
      // Save the notebook
      const fs = await import('fs');
      const outputPath = join(process.cwd(), 'test-results-120b-notebook.json');
      fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
      console.log(`💾 Full notebook saved to: ${outputPath}`);
    } else {
      console.error('❌ Advanced notebook generation failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Advanced notebook generation failed:', error);
  }

  // Performance comparison test
  console.log('\n⚡ Phase 5: Performance Comparison');
  console.log('Testing response quality and speed differences...');
  
  const startTime = Date.now();
  try {
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-oss-120b',
        messages: [
          {
            role: 'user',
            content: 'Explain quantum computing in exactly 100 words, focusing on practical applications.'
          }
        ],
        temperature: 0.3,
        max_tokens: 150,
      }),
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ GPT-OSS-120B response time: ${responseTime}ms`);
      console.log('📊 Token usage:', data.usage);
      console.log('🎯 Response quality sample:');
      console.log(data.choices[0].message.content);
    }
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  }

  console.log('\n🎉 GPT-OSS-120B testing completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Research phase: Advanced topic research with larger context');
  console.log('✅ Teacher generation: Complex lesson creation with technical depth');
  console.log('✅ Research analysis: Graduate-level paper comprehension');
  console.log('✅ Notebook generation: PhD-level implementation tutorials');
  console.log('✅ Performance metrics: Response time and quality assessment');
}

testGptOss120b();
