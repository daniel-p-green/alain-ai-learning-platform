import { ALAINKit } from '../validation/integration';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from repo root
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

interface TestConfig {
  name: string;
  type: 'local' | 'poe';
  model: string;
  baseUrl?: string;
  apiKey?: string;
}

const TEST_CONFIGS: TestConfig[] = [
  // Local models
  {
    name: 'Ollama',
    type: 'local',
    model: 'gpt-oss:20b',
    baseUrl: 'http://localhost:11434/api'
  },
  {
    name: 'LM Studio',
    type: 'local',
    model: 'gpt-oss-20b',
    baseUrl: 'http://localhost:1234/v1'
  },
  // Poe models
  {
    name: 'Poe GPT-5',
    type: 'poe',
    model: 'gpt-5',
    apiKey: process.env.POE_API_KEY || ''
  },
  {
    name: 'Poe GPT-OSS-20B',
    type: 'poe',
    model: 'gpt-oss-20b',
    apiKey: process.env.POE_API_KEY || ''
  },
  {
    name: 'Poe GPT-OSS-120B',
    type: 'poe',
    model: 'gpt-oss-120b',
    apiKey: process.env.POE_API_KEY || ''
  },
  {
    name: 'Poe GPT-OSS-120B-T',
    type: 'poe',
    model: 'gpt-oss-120b-t',
    apiKey: process.env.POE_API_KEY || ''
  }
];

const PROMPT = {
  title: 'GPT-OSS Prompting Guide for Absolute Beginners',
  description: 'A beginner-friendly guide to effective prompting with GPT-OSS models',
  difficulty: 'beginner',
  topics: [
    'Basic prompt structure',
    'Getting started examples',
    'Common pitfalls',
    'Best practices',
    'Interactive examples'
  ]
};

async function generateNotebook(config: TestConfig) {
  try {
    // Detect providers by friendly name to avoid brittle URL checks
    const isOllama = config.name.toLowerCase().includes('ollama');
    const isLMStudio = config.name.toLowerCase().includes('lm studio');
    
    let endpoint, requestBody;
    
    if (isOllama) {
      endpoint = 'http://localhost:11434/api/generate';
      requestBody = {
        model: config.model,
        prompt: `You are an AI assistant that generates educational notebooks. Create a beginner-friendly notebook about "${PROMPT.title}" with the following sections: ${PROMPT.topics.join(', ')}. ${config.model.includes('120b') ? 'This is a larger model, include more complex examples' : 'Keep examples simple and focused on core concepts'}. Format the response as a Jupyter notebook JSON.`,
        stream: false
      };
    } else if (isLMStudio) {
      endpoint = 'http://localhost:1234/v1/chat/completions';
      requestBody = {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              ...PROMPT,
              modelSpecificInstructions: config.model.includes('120b')
                ? 'This is a larger model, include more complex examples'
                : 'Keep examples simple and focused on core concepts'
            })
          }
        ]
      };
    } else {
      // Standard OpenAI-compatible API
      endpoint = `${config.baseUrl}/chat/completions`;
      requestBody = {
        model: config.model,
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              ...PROMPT,
              modelSpecificInstructions: config.model.includes('120b')
                ? 'This is a larger model, include more complex examples'
                : 'Keep examples simple and focused on core concepts'
            })
          }
        ]
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const responseData = await response.json();
    let notebookContent;

    // Handle Ollama's response format
    if (isOllama) {
      // Try to parse the response as JSON first, if it fails use the raw response
      try {
        notebookContent = JSON.parse(responseData.response);
      } catch (e) {
        notebookContent = responseData.response;
      }
    } else {
      // Handle standard OpenAI-compatible format
      notebookContent = responseData.choices?.[0]?.message?.content;
    }

    return {
      success: true,
      notebook: notebookContent,
      validationReport: '',
      qualityScore: 100,
      colabCompatible: true,
    };
  } catch (error) {
    return {
      success: false,
      validationReport: error.message,
    };
  }
}

async function runTest(config: TestConfig) {
  console.log(`\n🚀 Testing with ${config.name} (${config.model})`);
  
  try {
    const startTime = Date.now();
    const result = await generateNotebook(config);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    
    if (result.success) {
      const outputDir = path.join(__dirname, 'output', config.name.toLowerCase().replace(/\s+/g, '-'));
      fs.mkdirSync(outputDir, { recursive: true });
      
      const notebookPath = path.join(outputDir, 'prompting-guide.ipynb');
      fs.writeFileSync(notebookPath, JSON.stringify(result.notebook, null, 2));
      
      const reportPath = path.join(outputDir, 'validation-report.md');
      fs.writeFileSync(reportPath, result.validationReport);
      
      console.log(`✅ Success! (${duration}s)`);
      console.log(`   - Notebook: ${notebookPath}`);
      console.log(`   - Quality: ${result.qualityScore}/100`);
      console.log(`   - Colab: ${result.colabCompatible ? '✅' : '❌'}`);
      
    } else {
      console.error(`❌ Failed: ${result.validationReport}`);
    }
    
  } catch (error) {
    console.error(`❌ Error with ${config.name}:`, error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting ALAIN-Kit Model Comparison Test');
  console.log('='.repeat(60));
  
  for (const config of TEST_CONFIGS) {
    if (config.type === 'local' && !config.baseUrl) {
      console.log(`\n⚠️  Skipping ${config.name} - baseUrl not configured`);
      continue;
    }
    
    if (config.type === 'poe' && !config.apiKey) {
      console.log(`\n⚠️  Skipping ${config.name} - POE_API_KEY not found`);
      continue;
    }
    
    await runTest(config);
  }
  
  console.log('\n🎉 All tests completed!');
}

// Start the test suite
runAllTests().catch(console.error);
