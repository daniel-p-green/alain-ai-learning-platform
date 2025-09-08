# ALAIN - Applied Learning AI Notebooks

An interactive AI learning platform that combines theory with hands-on experience using real AI models.

## 🏗️ Architecture

This project consists of three main components:

- **Backend** (`/backend`): TypeScript API server using Encore.dev framework
- **Frontend** (`/frontend`): React SPA with TypeScript and Vite
- **Web** (`/web`): Next.js app with Clerk authentication

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Go (for Encore.dev backend)
- Python 3.8+ (for AI/ML dependencies)

### 1. Install Dependencies

```bash
# Install all workspace dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Copy the example configuration:

```bash
cp env-config-example.txt .env.local
```

Fill in your API keys:
- **Clerk**: Get from [Clerk Dashboard](https://dashboard.clerk.com)
- **Poe API**: Get from [Poe API Settings](https://poe.com/api_key)
- **OpenAI**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)

### 3. Configure Encore Secrets

Set up secrets for the backend:

```bash
encore secret set POE_API_KEY
encore secret set OPENAI_API_KEY
encore secret set OPENAI_BASE_URL
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend (Encore.dev)
npm run dev:backend

# Terminal 2: Frontend (React + Vite)
npm run dev:frontend

# Terminal 3: Web App (Next.js + Clerk)
npm run dev:web
```

## 📁 Project Structure

```
alain-ai-learning-platform/
├── backend/                 # Encore.dev TypeScript API
│   ├── execution/          # AI model execution endpoints
│   ├── tutorials/          # Tutorial management
│   └── progress/           # User progress tracking
├── frontend/               # React SPA
│   ├── components/         # Reusable UI components
│   └── lib/                # Utilities and configurations
├── web/                    # Next.js authentication app
│   └── app/                # Next.js app router
├── requirements.txt        # Python dependencies
└── requirements-dev.txt    # Development dependencies
```

## 🔧 Development Scripts

```bash
# Install all dependencies
npm run install:all

# Start individual services
npm run dev:backend     # Start Encore backend
npm run dev:frontend    # Start React frontend
npm run dev:web         # Start Next.js web app

# Build for production
npm run build:frontend  # Build React app
npm run build:web       # Build Next.js app
```

## 🔑 API Keys Setup

### Clerk Authentication
1. Sign up at [Clerk](https://clerk.com)
2. Create a new application
3. Copy publishable key and secret key to `.env.local`

### Poe API Integration
ALAIn supports multiple Poe integration approaches:

**Recommended:** Node.js OpenAI SDK
```bash
npm install openai@^4.28.0
```

**Alternative:** Python SDK
```bash
pip install fastapi-poe
```

1. Visit [Poe API Settings](https://poe.com/api_key)
2. Generate an API key
3. Add to environment variables: `POE_API_KEY=your_key_here`

### OpenAI API
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to environment variables: `OPENAI_API_KEY=your_key_here`

## 🗄️ Database Setup

The project uses PostgreSQL with Encore.dev's built-in database management. The database schema is automatically created through migrations.

To seed sample data:

```bash
curl -X POST "http://localhost:4000/seed"
```

## 🧪 Testing

```bash
# Run Python tests
pytest

# Run frontend type checking
cd frontend && npm run type-check

# Run web app linting
cd web && npm run lint
```

## 🚀 Deployment

### Encore Cloud (Backend)
```bash
encore auth login
git remote add encore encore://alain-ai-learning-platform-rui2
git push encore
```

### Frontend Deployment
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting provider
```

### Web App Deployment
```bash
cd web
npm run build
npm run start
# Deploy to Vercel, Netlify, or your preferred platform
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **Encore CLI not found**: Install with `brew install encoredev/tap/encore`
2. **Port conflicts**: Check if ports 4000, 5173, 3000 are available
3. **API key errors**: Verify environment variables are set correctly
4. **Database issues**: Ensure PostgreSQL is running and accessible

### Getting Help

- Check the [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions
- Review the [Encore.dev documentation](https://encore.dev/docs)
- Open an issue for bugs or feature requests
