# Poe API Integration Guide for ALAIn

## Overview

ALAIn supports multiple approaches for integrating with Poe API. This guide compares the different methods and provides recommendations based on your use case.

## Integration Methods

### 1. 🏆 **RECOMMENDED: Node.js OpenAI SDK** (New Implementation)

**Best for ALAIn's architecture** - Uses familiar OpenAI SDK patterns with Poe's compatible endpoint.

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.POE_API_KEY,
  baseURL: 'https://api.poe.com/v1', // Poe's endpoint
});

// Use like regular OpenAI SDK
const response = await client.chat.completions.create({
  model: 'GPT-4o', // Poe model names
  messages: [...],
  stream: true
});
```

**✅ Pros:**
- Consistent with existing OpenAI integration
- TypeScript support with full IntelliSense
- Streaming support built-in
- Familiar error handling
- Single dependency (OpenAI SDK)
- Better performance than Python

**❌ Cons:**
- Requires OpenAI SDK v4+ (different from v3)
- Poe-specific model names needed

**📍 Current Status:** Implemented in `backend/execution/poe-nodejs.ts`

### 2. 🥈 **Python fastapi-poe SDK** (Already in Requirements)

**Good for Python-heavy workflows** - Official Poe SDK with comprehensive features.

```python
import fastapi_poe as fp

message = fp.ProtocolMessage(role="user", content="Hello!")
for partial in fp.get_bot_response_sync(
    messages=[message],
    bot_name="GPT-4o",
    api_key=api_key
):
    print(partial)
```

**✅ Pros:**
- Official Poe SDK
- Comprehensive Poe-specific features
- Good for file uploads
- Async/await support
- Built-in streaming

**❌ Cons:**
- Python-only (not TypeScript)
- Additional dependency management
- Context switching between languages
- Performance overhead for simple requests

**📍 Current Status:** Available in `requirements.txt`, example in `poe-python-example.py`

### 3. **Direct HTTP/cURL** (Current Implementation)

**Simple but not recommended for production** - Direct API calls without SDK abstraction.

```bash
curl -X POST "https://api.poe.com/v1/chat/completions" \
  -H "Authorization: Bearer $POE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "GPT-4o", "messages": [...]}'
```

**✅ Pros:**
- No additional dependencies
- Full control over requests
- Good for testing/debugging
- Works with any language

**❌ Cons:**
- Manual error handling
- No built-in streaming helpers
- Verbose code
- Easy to make mistakes
- No TypeScript support

**📍 Current Status:** Used in current `backend/execution/execute.ts` and `web/app/api/execute/route.ts`

### 4. **Python OpenAI SDK with Poe**

**Alternative Python approach** - Uses OpenAI SDK configured for Poe endpoint.

```python
from openai import OpenAI

client = OpenAI(
    api_key=os.getenv("POE_API_KEY"),
    base_url="https://api.poe.com/v1"
)

response = client.chat.completions.create(
    model="GPT-4o",
    messages=[...]
)
```

**✅ Pros:**
- Familiar OpenAI SDK patterns
- Cross-platform consistency
- Good streaming support

**❌ Cons:**
- Python-only
- Same dependency issues as fastapi-poe
- Poe model names required

## Recommendation for ALAIn

### 🚀 **Primary Recommendation: Node.js OpenAI SDK**

For your ALAIn platform, I recommend switching to the **Node.js OpenAI SDK approach** because:

1. **Architectural Consistency** - Your entire backend is TypeScript/Node.js
2. **Unified Codebase** - No language switching between Python and Node.js
3. **Better Performance** - Native Node.js vs Python overhead
4. **Familiar Patterns** - Same patterns as your existing OpenAI integration
5. **Type Safety** - Full TypeScript support with proper types
6. **Easier Maintenance** - Single language, single dependency approach

### 🔄 **Migration Strategy**

1. **Keep Python SDK for specific use cases:**
   - File upload handling (fastapi-poe has better file support)
   - Python-based ML workflows
   - Legacy Python scripts

2. **Migrate main integrations to Node.js OpenAI SDK:**
   - Backend API calls (`backend/execution/execute.ts`)
   - Web app API routes (`web/app/api/execute/route.ts`)
   - Future integrations

### 📋 **Implementation Steps**

1. **Add OpenAI SDK to backend:**
   ```bash
   cd backend && npm install openai@^4.28.0
   ```

2. **Update PoeProvider class:**
   - Replace fetch-based implementation with OpenAI SDK
   - Use `https://api.poe.com/v1` as base URL
   - Update model names to Poe format

3. **Test thoroughly:**
   - Verify all Poe models work
   - Test streaming functionality
   - Confirm error handling works

4. **Update documentation:**
   - Update API documentation
   - Update environment setup guides

## Poe Model Names

When using Poe API, use these model names:

- `GPT-4o` (recommended)
- `GPT-4o-mini`
- `Claude-3.5-Sonnet`
- `Claude-3-Haiku`
- `Gemini-1.5-Pro`
- `Gemini-1.5-Flash`
- `Grok-2`
- `Llama-3.1-405B`
- And many more...

## Configuration

Add to your environment:

```bash
POE_API_KEY=your_poe_api_key_here
```

Get your key from: https://poe.com/api_key

## Testing

Use the provided `poe-python-example.py` to test different approaches:

```bash
export POE_API_KEY=your_key_here
python poe-python-example.py
```

This will test all integration methods and help you choose the best approach for your needs.
