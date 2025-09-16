#!/usr/bin/env tsx
/**
 * Test script for GPT-OSS-20B research function
 * Run with: npx tsx scripts/test-research-gpt-oss-20b.ts
 */

import { researchModel, generateResearchSummary } from '../utils/research';
import { join } from 'path';

const REPO_ROOT = join(__dirname, '../../..');

async function testGptOss20bResearch() {
  console.log('🚀 Testing GPT-OSS-20B research function...\n');
  
  try {
    // Run comprehensive research
    const researchDir = await researchModel(
      'gpt-oss-20b',
      'openai',
      REPO_ROOT
    );
    
    console.log('\n📊 Generating research summary...');
    const summary = generateResearchSummary(researchDir);
    console.log('\n' + summary);
    
    console.log('🎉 Research test completed successfully!');
    console.log(`📁 Research saved to: ${researchDir}`);
    
  } catch (error) {
    console.error('❌ Research test failed:', error);
  }
}

// Run the test
testGptOss20bResearch();
