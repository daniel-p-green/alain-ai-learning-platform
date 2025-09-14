// Simple test script to call the teacher API directly for BERT research
import { readFile } from 'fs/promises';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

async function testBertResearch() {
  console.log('🔍 Testing BERT research using ALAIN-Kit research prompt...');
  
  // Load the research prompt directly
  const researchPrompt = await readFile(
    path.join(__dirname, '../prompts/alain-kit/research.harmony.txt'), 
    'utf-8'
  );
  
  const hfUrl = 'https://huggingface.co/google-bert/bert-base-uncased';
  const modelName = 'google-bert/bert-base-uncased';
  
  // Fetch model card data
  console.log('📡 Fetching model card data...');
  const modelResponse = await fetch(`https://huggingface.co/api/models/${modelName}`);
  const modelCard = await modelResponse.json();
  
  // Build the research context
  const researchContext = `Please conduct comprehensive research on the model: ${modelName}

HUGGING FACE URL: ${hfUrl}
RESEARCH TOPIC: Understanding BERT architecture, capabilities, and educational applications

MODEL CARD DATA:
${JSON.stringify(modelCard, null, 2)}

Please analyze this model following the ALAIN-Kit research methodology and use the emit_research_findings function to return structured, comprehensive research data including:

- Technical specifications (architecture, parameters, training data)
- Educational context (learning objectives, prerequisites, difficulty levels)
- Implementation guidance (code examples, best practices, common pitfalls)
- Community resources (tutorials, papers, real-world examples)
- Quality validation and completeness assessment

Use the emit_research_findings function to return the structured JSON output.`;

  // Make direct API call to Poe
  const poeApiKey = process.env.POE_API_KEY;
  if (!poeApiKey) {
    console.error('❌ POE_API_KEY environment variable not set');
    return;
  }
  
  console.log('🤖 Sending research request to GPT-4-Turbo...');
  
  const payload = {
    model: 'gpt-4-turbo',
    messages: [
      {
        role: 'system',
        content: `You are an AI research assistant specialized in analyzing machine learning models for educational purposes.`
      },
      {
        role: 'user',
        content: researchContext
      }
    ],
    temperature: 0.2,
    max_tokens: 4096,
    tools: [
      {
        type: 'function',
        function: {
          name: 'emit_research_findings',
          description: 'Return structured, comprehensive research findings for a model.',
          parameters: { 
            type: 'object', 
            properties: {
              model_name: { type: 'string' },
              model_url: { type: 'string' },
              technical_specs: {
                type: 'object',
                properties: {
                  parameters: { type: 'string' },
                  architecture: { type: 'string' },
                  context_window: { type: 'integer' },
                  training_data: { type: 'array', items: { type: 'string' } },
                  license: { type: 'string' }
                }
              },
              educational_context: {
                type: 'object',
                properties: {
                  prerequisites: { type: 'array', items: { type: 'string' } },
                  learning_objectives: { type: 'array', items: { type: 'string' } },
                  difficulty_level: { type: 'string' },
                  common_challenges: { type: 'array', items: { type: 'string' } }
                }
              },
              implementation_guide: {
                type: 'object',
                properties: {
                  code_examples: { type: 'array', items: { type: 'object' } },
                  best_practices: { type: 'array', items: { type: 'string' } },
                  common_pitfalls: { type: 'array', items: { type: 'string' } }
                }
              },
              community_resources: {
                type: 'object',
                properties: {
                  tutorials: { type: 'array', items: { type: 'string' } },
                  papers: { type: 'array', items: { type: 'string' } },
                  github_repos: { type: 'array', items: { type: 'string' } }
                }
              },
              quality_score: { type: 'number', minimum: 0, maximum: 100 }
            },
            required: ['model_name', 'technical_specs', 'educational_context']
          }
        }
      }
    ]
  };
  
  try {
    const response = await fetch("https://api.poe.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${poeApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "ALAIN-Research/1.0",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Poe API error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Poe API error: ${data.error.message}`);
    }
    
    console.log('✅ Research completed successfully!');
    
    // Extract content from response
    const choice = data?.choices?.[0];
    const message = choice?.message || {};
    const toolCalls = message.tool_calls;
    
    let researchData;
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      const fn = toolCalls[0]?.function;
      const args = fn?.arguments;
      if (args && typeof args === 'string') {
        researchData = JSON.parse(args);
      }
    } else {
      // Fallback to message content
      const content = message.content || '';
      try {
        researchData = JSON.parse(content);
      } catch {
        researchData = { raw_content: content };
      }
    }
    
    // Display research summary
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
    
    // Save results
    const outputDir = path.join('research-outputs', 'bert-alain-kit-research');
    await mkdir(outputDir, { recursive: true });
    
    const outputFile = path.join(outputDir, `bert-research-${Date.now()}.json`);
    const fullResults = {
      timestamp: new Date().toISOString(),
      model_url: hfUrl,
      model_name: modelName,
      model_card: modelCard,
      research_data: researchData,
      raw_response: data,
      metadata: {
        temperature: payload.temperature,
        max_tokens: payload.max_tokens,
        alain_kit_phase: 'research'
      }
    };
    
    await writeFile(outputFile, JSON.stringify(fullResults, null, 2));
    console.log(`\n💾 Full research results saved to: ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Research failed:', error);
  }
}

testBertResearch();
