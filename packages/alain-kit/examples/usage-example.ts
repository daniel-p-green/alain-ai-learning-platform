/**
 * ALAIN-Kit Usage Example
 * 
 * Demonstrates how to use the clean ALAIN-Kit system to generate
 * high-quality, Colab-compatible notebooks.
 */

import { ALAINKit } from '../validation/integration';

async function example() {
  const alainKit = new ALAINKit();
  
  // Generate notebook for TinyLlama model
  const result = await alainKit.generateNotebook({
    modelReference: 'https://huggingface.co/TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF',
    apiKey: 'your-poe-api-key',
    difficulty: 'beginner',
    maxSections: 5
  });

  if (result.success) {
    console.log(`✅ Generated notebook with ${result.qualityScore}/100 quality score`);
    console.log(`📱 Colab compatible: ${result.colabCompatible}`);
    
    // Save notebook
    require('fs').writeFileSync(
      'generated-notebook.ipynb',
      JSON.stringify(result.notebook, null, 2)
    );
    
    // Save validation report
    require('fs').writeFileSync(
      'validation-report.md',
      result.validationReport
    );
    
  } else {
    console.error('❌ Generation failed:', result.validationReport);
  }
}

// Run example
example().catch(console.error);
