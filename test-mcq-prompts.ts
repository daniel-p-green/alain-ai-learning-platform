import { readFileSync } from 'fs';
import { join } from 'path';

// Test script to verify MCQ generation in updated ALAIN-Kit prompts
async function testMCQPrompts() {
  console.log('🧪 Testing updated ALAIN-Kit prompts for MCQ generation...\n');

  // Read the updated prompts
  const poePrompt = readFileSync(join(process.cwd(), 'prompts/alain-kit/flattened/poe/research.online.v2025-09-13.txt'), 'utf8');
  const optimizedPrompt = readFileSync(join(process.cwd(), 'prompts/alain-kit/optimized/research.optimized.v1.txt'), 'utf8');

  console.log('📋 Poe Prompt Analysis:');
  console.log('- MCQ requirement present:', poePrompt.includes('multiple choice questions'));
  console.log('- JSON format specified:', poePrompt.includes('OUTPUT FORMAT'));
  console.log('- Assessments field required:', poePrompt.includes('"assessments"'));
  console.log('- Learning objectives included:', poePrompt.includes('"learning_objectives"'));

  console.log('\n📋 Optimized Prompt Analysis:');
  console.log('- MCQ requirement present:', optimizedPrompt.includes('multiple choice questions'));
  console.log('- JSON format specified:', optimizedPrompt.includes('OUTPUT FORMAT'));
  console.log('- Assessments field required:', optimizedPrompt.includes('"assessments"'));
  console.log('- Learning objectives included:', optimizedPrompt.includes('"learning_objectives"'));

  // Test with a simple model reference
  const testModel = 'huggingface.co/openai/gpt-oss-20b';
  
  if (process.env.POE_API_KEY) {
    console.log('\n🔄 Testing Poe API with updated prompt...');
    
    const finalPrompt = poePrompt.replace('{{MODEL_REFERENCE_OR_TEXT}}', testModel);
    
    try {
      const response = await fetch('https://api.poe.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.POE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-oss-20b',
          messages: [
            { role: 'system', content: finalPrompt.split('\n').slice(1, -3).join('\n') },
            { role: 'user', content: testModel }
          ],
          temperature: 0.2,
          max_tokens: 2048
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        
        console.log('✅ Poe API response received');
        
        // Try to parse as JSON
        try {
          const parsed = JSON.parse(content);
          console.log('✅ Valid JSON response');
          console.log('- Has assessments:', Array.isArray(parsed.assessments));
          console.log('- Assessment count:', parsed.assessments?.length || 0);
          console.log('- Has learning objectives:', Array.isArray(parsed.learning_objectives));
          console.log('- Steps count:', parsed.steps?.length || 0);
          
          if (parsed.assessments && parsed.assessments.length > 0) {
            const firstAssessment = parsed.assessments[0];
            console.log('- First MCQ has 4 options:', firstAssessment.options?.length === 4);
            console.log('- Has explanation:', !!firstAssessment.explanation);
          }
        } catch (parseError) {
          console.log('❌ Response is not valid JSON');
          console.log('First 200 chars:', content.substring(0, 200));
        }
      } else {
        console.log('❌ Poe API error:', response.status);
      }
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }
  } else {
    console.log('\n⚠️  POE_API_KEY not set, skipping live API test');
  }

  console.log('\n✅ Prompt analysis complete');
}

testMCQPrompts().catch(console.error);
