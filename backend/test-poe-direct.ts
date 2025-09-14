import fetch from 'node-fetch';

const POE_API_KEY = 'qZB4vYDsDMytPrL9t4N4SGi_M56X_b0vst0l1fuJu9s';
const POE_API_URL = 'https://api.poe.com/v1/chat/completions';

async function testPoeConnection() {
  console.log('🔑 Testing Poe API connection...');
  
  const requestData = {
    model: 'gpt-oss-20b',
    messages: [{ role: 'user', content: 'Say hello' }],
    max_tokens: 50,
    temperature: 0.7,
  };

  console.log('Sending request to Poe API...');
  
  try {
    const response = await fetch(POE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${POE_API_KEY}`,
      },
      body: JSON.stringify(requestData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Error from Poe API:', data);
      process.exit(1);
    }

    console.log('✅ Successfully connected to Poe API!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error connecting to Poe API:');
    console.error(error);
    process.exit(1);
  }
}

testPoeConnection();
