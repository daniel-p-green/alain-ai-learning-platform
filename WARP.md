# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

### Development Servers
```bash
# Start all services for development
npm run dev:backend    # Encore.dev backend (port 4000)
npm run dev:frontend   # React SPA with Vite (port 5173)  
npm run dev:web        # Next.js app with Clerk auth (port 3000)

# Alternative: Start individual services
cd backend && encore run
cd frontend && npx vite dev
cd web && npm run dev
```

### Installation and Setup
```bash
# Install workspace dependencies
npm install

# Install Python dependencies for AI/ML features
pip install -r requirements.txt
pip install -r requirements-dev.txt  # for development tools

# Copy environment configuration template
cp env-config-example.txt .env.local

# Set up Encore secrets (required for backend)
encore secret set POE_API_KEY
encore secret set OPENAI_API_KEY  # optional
encore secret set OPENAI_BASE_URL # optional
```

### Building for Production
```bash
npm run build:frontend  # Build React SPA
npm run build:web      # Build Next.js app
cd backend && encore build  # Build backend for deployment
```

### Testing
```bash
# Run Python tests
pytest

# Run TypeScript tests (backend)
cd backend && npm run test

# Type checking for frontend
cd frontend && npm run type-check

# Linting for web app
cd web && npm run lint
```

### Database and Seeding
```bash
# Seed sample tutorial data (after backend is running)
curl -X POST "http://localhost:4000/seed"
```

### Deployment
```bash
# Deploy backend to Encore Cloud
encore auth login
git push encore

# For GitHub integration (recommended for production)
git push origin main  # auto-deploys via GitHub integration
```

### Single Test Execution
```bash
# Run specific test files
cd backend && npm test -- logic.test.ts
cd backend && npm test -- validation.test.ts
pytest -k "test_specific_function"  # Python tests
```

## Architecture

### High-Level System Design
ALAIN is a multi-component AI learning platform that generates interactive lessons from AI model sources:

```
User → Frontend/Web → Backend (Encore.ts) → AI Providers (Poe/OpenAI) → Streaming Response
```

### Core Components

#### Backend (`/backend`) - Encore.dev TypeScript API
- **Framework**: Encore.dev with TypeScript
- **Services**:
  - `execution/`: AI model execution with streaming support
  - `tutorials/`: Tutorial CRUD operations and lesson management
  - `assessments/`: MCQ assessments with explanations
  - `export/`: Colab notebook export functionality
  - `auth.ts`: Clerk JWT authentication integration

#### Frontend (`/frontend`) - React SPA
- **Framework**: React + Vite + TypeScript
- **Purpose**: Lightweight tutorial player and demo interface
- **Components**: Tutorial catalog, player, navigation, landing page

#### Web App (`/web`) - Next.js with Authentication
- **Framework**: Next.js 14 with App Router + Clerk authentication
- **Primary UI**: Main user interface for the platform
- **Features**: User authentication, lesson browsing, interactive player

### AI Provider Architecture
The system supports multiple AI providers through a unified interface:

- **Poe Provider**: Primary provider using Poe API
  - Models: GPT-4o, Claude-3.5-Sonnet, Gemini-1.5-Pro, etc.
  - Teacher models: GPT-OSS-20B, GPT-OSS-120B for lesson generation
- **OpenAI-Compatible Provider**: BYOK with configurable base URL
  - Supports vLLM, Ollama, and other OpenAI-compatible endpoints

### Data Flow
1. **Lesson Generation**: Teacher models (GPT-OSS) convert model links to structured lessons
2. **Execution**: Student requests routed through provider abstraction layer
3. **Streaming**: Server-sent events (SSE) for real-time AI responses
4. **Authentication**: Clerk JWT tokens for user session management

### Key Patterns
- **Provider Pattern**: Abstracted AI provider implementations in `execution/providers/`
- **Streaming Architecture**: SSE endpoints with timeout and abort handling
- **Service-Oriented**: Encore services with clear API boundaries
- **Type Safety**: Full TypeScript coverage with shared interfaces

## Environment Configuration

### Required Environment Variables
```bash
# Clerk Authentication (required for web app)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_JWT_ISSUER=  # for backend JWT verification

# Poe API (primary provider)
POE_API_KEY=  # Get from https://poe.com/api_key

# OpenAI-Compatible (optional, for BYOK)
OPENAI_API_KEY=
OPENAI_BASE_URL=  # e.g., http://localhost:11434/v1 for Ollama
```

### API Key Setup
- **Clerk**: Dashboard at https://dashboard.clerk.com
- **Poe**: API settings at https://poe.com/api_key  
- **OpenAI**: Platform at https://platform.openai.com/api-keys

## Development Patterns

### Encore.dev Specifics
- Services defined with `new Service("service-name")` exports
- APIs use `api()` decorator with configuration objects
- Secrets managed via `encore secret set` command
- Database migrations handled automatically
- Type-safe inter-service communication

### Authentication Flow
1. User authenticates via Clerk in Next.js app
2. JWT token forwarded to Encore backend
3. `requireUserId()` middleware validates tokens
4. Rate limiting applied per authenticated user

### AI Provider Integration
- Providers implement common `Provider` interface
- Model name mapping handles provider-specific naming
- Error handling standardized across providers
- Streaming support with abort controllers

### Testing Strategy
- Unit tests for business logic (`.test.ts` files)
- Integration tests for API endpoints
- Python tests for AI/ML utilities
- Type checking for compile-time validation

## Troubleshooting

### Common Issues
- **Encore CLI not found**: Install with `brew install encoredev/tap/encore`
- **Port conflicts**: Default ports are 4000 (backend), 5173 (frontend), 3000 (web)
- **API key errors**: Verify secrets are set via `encore secret set`
- **Authentication failures**: Check Clerk configuration and JWT issuer

### Development Dependencies
- **Node.js**: Version 18+ required
- **Go**: Required for Encore.dev backend
- **Python**: 3.8+ for AI/ML dependencies and testing
- **Bun**: Optional package manager (configured in package.json)

### ALAIN-Kit Methodology
The platform uses a structured approach for content generation:
1. **Research**: Parse model sources and extract capabilities
2. **Design**: Define learning objectives and assessment strategy  
3. **Develop**: Generate interactive notebooks with runnable cells
4. **Validate**: Quality checks for execution and educational value
