# API Token Setup Guide

This guide provides step-by-step instructions for acquiring and configuring API tokens required by ALAIN.

## Required Tokens

ALAIN requires the following API tokens to function:

### 1. Poe API Key (`POE_API_KEY`)
**Purpose**: Access to Poe's hosted AI models including GPT-OSS-20B and GPT-OSS-120B

**How to get it**:
1. Visit [poe.com](https://poe.com)
2. Sign up or log in to your account
3. Go to Settings → API Access
4. Generate a new API key
5. Copy the key (starts with `poe-`)

**Format**: `poe-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. OpenAI API Key (`OPENAI_API_KEY`)
**Purpose**: Access to OpenAI models or OpenAI-compatible endpoints

**Option A - OpenAI Official**:
1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to API Keys section
4. Create new secret key
5. Copy the key (starts with `sk-`)

**Option B - Local/Self-hosted**:
- For LM Studio: Use any non-empty string (e.g., `lm-studio`)
- For Ollama: Use any non-empty string (e.g., `ollama`)

**Format**: `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (OpenAI) or custom string (local)

### 3. OpenAI Base URL (`OPENAI_BASE_URL`)
**Purpose**: Endpoint URL for OpenAI-compatible API

**Options**:
- **OpenAI Official**: `https://api.openai.com/v1`
- **LM Studio**: `http://localhost:1234/v1`
- **Ollama**: `http://localhost:11434/v1`
- **Custom endpoint**: Your self-hosted URL

### 4. Kaggle API (optional: `KAGGLE_USERNAME`, `KAGGLE_KEY`)
Purpose: Enrich the Research phase with Kaggle datasets, notebooks, and competitions.

How to get it:
- In Kaggle, create API credentials and download `kaggle.json`, or copy username/key from your account page.

Setup (Encore secrets or env):
```bash
cd backend
encore secret set KAGGLE_USERNAME
encore secret set KAGGLE_KEY
# or in backend/.env for local only
echo "KAGGLE_USERNAME=your_username" >> backend/.env
echo "KAGGLE_KEY=your_key" >> backend/.env
```

Notes:
- Without credentials, Kaggle is skipped automatically.
- Outputs are saved under `content/research/<provider>/<model>/kaggle-content.md`.

## Setting Up Secrets

### For Development (Local)

1. **Install Encore CLI**:
   ```bash
   curl -L https://encore.dev/install.sh | bash
   ```

2. **Set secrets using Encore CLI**:
   ```bash
   # Navigate to backend directory
   cd backend

   # Set Poe API key
   encore secret set POE_API_KEY

   # Set OpenAI API key
   encore secret set OPENAI_API_KEY

   # Set OpenAI base URL
   encore secret set OPENAI_BASE_URL
   
   # (Optional) Set Kaggle credentials
   encore secret set KAGGLE_USERNAME
   encore secret set KAGGLE_KEY
   ```

3. **Verify secrets are set**:
   ```bash
   encore secret list
   ```

### For Production (Encore Cloud)

1. **Deploy to Encore Cloud**:
   ```bash
   encore app create alain-platform
   encore deploy
   ```

2. **Set production secrets via dashboard**:
   - Go to [app.encore.dev](https://app.encore.dev)
   - Select your app
   - Navigate to Settings → Secrets
   - Add each required secret

### Alternative: Environment Variables

For local development, you can also use environment variables:

```bash
# Create .env file in backend directory
echo "POE_API_KEY=your_poe_key_here" >> backend/.env
echo "OPENAI_API_KEY=your_openai_key_here" >> backend/.env
echo "OPENAI_BASE_URL=https://api.openai.com/v1" >> backend/.env
echo "KAGGLE_USERNAME=your_username" >> backend/.env   # optional
echo "KAGGLE_KEY=your_key" >> backend/.env            # optional
```

**Note**: Environment variables are only for local development. Production should use Encore secrets.

## Validation

### Test Your Setup

1. **Start the backend**:
   ```bash
   cd backend
   encore run
   ```

2. **Check health endpoint**:
   ```bash
   curl http://localhost:4000/execution/health
   ```

3. **Expected response**:
   ```json
   {
     "status": "healthy",
     "services": {
       "poe": {"status": "healthy"},
       "openai": {"status": "healthy"},
       "database": {"status": "healthy"}
     }
   }
   ```

### Common Issues

**Issue**: `POE_API_KEY not configured`
- **Solution**: Ensure you've set the secret and it starts with `poe-`

**Issue**: `OpenAI connection failed`
- **Solution**: Check `OPENAI_BASE_URL` is correct and service is running

**Issue**: `Database connection failed`
- **Solution**: Ensure PostgreSQL is running (Encore handles this automatically)

**Issue**: Kaggle 401/403
- **Solution**: Ensure both `KAGGLE_USERNAME` and `KAGGLE_KEY` are set and valid.

---

## Provider Selection & UI Toggle

Backend (teacher runtime):
- `TEACHER_PROVIDER=poe|openai-compatible` controls which provider the teacher uses by default.
- Per-request `provider` overrides are respected. When unset, defaults to `poe`.

Frontend (UI default):
- `NEXT_PUBLIC_PROMPT_MODE=poe|openai` sets the UI’s default for generation/phases; users can change it in Settings.

Notes:
- Poe requires `POE_API_KEY`.
- OpenAI‑compatible requires `OPENAI_BASE_URL` and `OPENAI_API_KEY` (the key can be omitted for local runtimes like LM Studio/Ollama).

## Security Best Practices

### ✅ Do:
- Store secrets using Encore's secret management
- Use different API keys for development and production
- Rotate API keys regularly
- Monitor API usage and costs

### ❌ Don't:
- Commit API keys to version control
- Share API keys in chat or email
- Use production keys in development
- Hardcode secrets in source code

## Cost Considerations

### Poe API
- Pay-per-use pricing
- GPT-OSS-20B: ~$0.001 per request
- GPT-OSS-120B: ~$0.01 per request
- Monitor usage at [poe.com/api](https://poe.com/api)

### OpenAI API
- Token-based pricing
- GPT-4: $0.03/1K input tokens, $0.06/1K output tokens
- GPT-3.5-turbo: $0.001/1K input tokens, $0.002/1K output tokens
- Monitor usage at [platform.openai.com/usage](https://platform.openai.com/usage)

### Local Models (Free)
- LM Studio: No API costs (uses local compute)
- Ollama: No API costs (uses local compute)
- Requires sufficient local hardware (8GB+ RAM recommended)

## Troubleshooting

### Debug Mode
Enable debug logging to troubleshoot token issues:

```bash
# Set debug environment variable
export DEBUG=alain:*

# Run backend with debug output
encore run
```

### Health Check Details
Get detailed health information:

```bash
curl -v http://localhost:4000/execution/health
```

### Support
- Check [Encore documentation](https://encore.dev/docs)
- Review [Poe API docs](https://developer.poe.com)
- Consult [OpenAI API docs](https://platform.openai.com/docs)

---

**Next Steps**: After setting up tokens, proceed to the [Development Guide](./DEVELOPMENT.md) to start the application.
