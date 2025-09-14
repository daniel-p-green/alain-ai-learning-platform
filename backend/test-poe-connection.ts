import { poeProvider } from './execution/providers/poe';
import type { ExecuteRequest } from './execution/providers';

async function testPoeConnection() {
  const apiKey = process.env.POE_API_KEY;
  if (!apiKey) {
    console.error('❌ POE_API_KEY not found in environment variables');
    process.exit(1);
  }

  console.log('🔑 Using Poe API key:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 3));
  
  try {
    console.log('🚀 Testing Poe API connection...');
    
    // Test with a simple completion
    const request: ExecuteRequest = {
      provider: 'poe',
      model: 'gpt-oss-20b',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 50,
      temperature: 0.7,
    };

    console.log('Sending request:', JSON.stringify(request, null, 2));
    
    // Use the provider's execute method
    const response = await poeProvider.execute(request);

    console.log('✅ Successfully connected to Poe API!');
    console.log('Response:', response);
  } catch (error) {
    console.error('❌ Error connecting to Poe API:');
    console.error(error);
    process.exit(1);
  }
}

testPoeConnection();
