import { teacherGenerate } from './execution/teacher';

async function testBertResearchWithAlainKit() {
  console.log('🔍 Testing BERT research using ALAIN-Kit methodology...');
  
  // Set environment variables for ALAIN-Kit research phase
  process.env.TEACHER_PROMPT_PHASE = 'research';
  process.env.TEACHER_ENABLE_TOOLS = '1';
  
  const hfUrl = 'https://huggingface.co/google-bert/bert-base-uncased';
  const modelName = 'google-bert/bert-base-uncased';
  
  const researchRequest = {
    model: 'GPT-OSS-20B' as const,
    task: 'lesson_generation' as const, // Using lesson_generation as the base task
    messages: [
      {
        role: 'user' as const,
        content: `Please conduct comprehensive research on the model: ${modelName}

HUGGING FACE URL: ${hfUrl}

RESEARCH OBJECTIVES:
- Analyze the model architecture and capabilities
- Identify key technical specifications and performance characteristics  
- Document training methodology and datasets used
- Evaluate practical applications and use cases
- Assess limitations and considerations for educational use
- Generate structured learning objectives and educational pathways

Please use the emit_research_findings function to return structured research data following the ALAIN-Kit research methodology.`
      }
    ],
    temperature: 0.2,
    max_tokens: 4096
  };

  try {
    console.log('📡 Sending research request to GPT-OSS-20B via teacher system...');
    
    const response = await teacherGenerate(researchRequest, {} as any);
    
    if (response.success) {
      console.log('✅ Research completed successfully!');
      console.log(`Provider: ${response.provider}`);
      console.log(`Model: ${response.usedModel}`);
      
      if (response.downgraded) {
        console.log('⚠️  Model was downgraded from GPT-OSS-120B to GPT-OSS-20B');
      }
      
      // Parse and display the research findings
      let researchData;
      try {
        researchData = JSON.parse(response.content || '{}');
        console.log('\n📊 Research Findings Summary:');
        console.log('='.repeat(50));
        
        if (researchData.model_name) {
          console.log(`Model: ${researchData.model_name}`);
        }
        
        if (researchData.key_findings) {
          console.log(`\n🔍 Key Findings (${researchData.key_findings.length}):`);
          researchData.key_findings.forEach((finding: string, i: number) => {
            console.log(`${i + 1}. ${finding}`);
          });
        }
        
        if (researchData.learning_objectives) {
          console.log(`\n🎯 Learning Objectives (${researchData.learning_objectives.length}):`);
          researchData.learning_objectives.forEach((obj: string, i: number) => {
            console.log(`${i + 1}. ${obj}`);
          });
        }
        
        if (researchData.educational_pathways) {
          console.log(`\n📚 Educational Pathways:`);
          researchData.educational_pathways.forEach((pathway: any, i: number) => {
            console.log(`\n${i + 1}. ${pathway.title || pathway.name} (${pathway.difficulty || 'N/A'})`);
            if (pathway.description) {
              console.log(`   ${pathway.description}`);
            }
          });
        }
        
        if (researchData.quality_score) {
          console.log(`\n📈 Quality Score: ${researchData.quality_score}/100`);
        }
        
      } catch (parseError) {
        console.log('\n📝 Raw Research Output:');
        console.log(response.content);
      }
      
      // Save the research results
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const outputDir = path.join('resources', 'research-outputs', 'bert-alain-kit-research');
      await fs.mkdir(outputDir, { recursive: true });
      
      const outputFile = path.join(outputDir, `bert-research-${Date.now()}.json`);
      const fullResults = {
        timestamp: new Date().toISOString(),
        model_url: hfUrl,
        model_name: modelName,
        provider: response.provider,
        used_model: response.usedModel,
        research_data: researchData || response.content,
        metadata: {
          temperature: researchRequest.temperature,
          max_tokens: researchRequest.max_tokens,
          alain_kit_phase: 'research'
        }
      };
      
      await fs.writeFile(outputFile, JSON.stringify(fullResults, null, 2));
      console.log(`\n💾 Full research results saved to: ${outputFile}`);
      
    } else {
      console.error('❌ Research failed:');
      console.error(`Error Code: ${response.error?.code}`);
      console.error(`Error Message: ${response.error?.message}`);
      if (response.error?.details) {
        console.error('Details:', response.error.details);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
  }
}

// Run the test
testBertResearchWithAlainKit();
