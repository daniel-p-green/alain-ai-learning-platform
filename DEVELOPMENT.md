# Getting Started

This project consists of an Encore application. Follow the steps below to get the app running locally.

## Prerequisites

If this is your first time using Encore, you need to install the CLI that runs the local development environment. Use the appropriate command for your system:

- **macOS:** `brew install encoredev/tap/encore`
- **Linux:** `curl -L https://encore.dev/install.sh | bash`
- **Windows:** `iwr https://encore.dev/install.ps1 | iex`

This repo is configured to use npm as the package manager. If you previously had Bun configured, switch to npm with the steps below.

## Running the Application

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install backend deps (first time only):
   ```bash
   cd backend
   npm install
   ```

3. Start the Encore development server:
   ```bash
   encore run
   ```

The backend will be available at the URL shown in your terminal (typically `http://localhost:4000`).



### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx vite dev
   ```

The frontend will be available at `http://localhost:5173` (or the next available port).


### Generate Frontend Client
To generate the frontend client, run the following command in the `backend` directory:

```bash
encore gen client --target leap
```

## Deployment

### Self-hosting
See the [self-hosting instructions](https://encore.dev/docs/self-host/docker-build) for how to use encore build docker to create a Docker image and
configure it.

### Encore Cloud Platform

#### Step 1: Login to your Encore Cloud Account

Before deploying, ensure you have authenticated the Encore CLI with your Encore account (same as your Leap account)

```bash
encore auth login
```

#### Step 2: Set Up Git Remote

Add Encore's git remote to enable direct deployment:

```bash
git remote add encore encore://alain-ai-learning-platform-rui2
```

#### Step 3: Deploy Your Application

Deploy by pushing your code:

```bash
git add -A .
git commit -m "Deploy to Encore Cloud"
git push encore
```

Monitor your deployment progress in the [Encore Cloud dashboard](https://app.encore.dev/alain-ai-learning-platform-rui2/deploys).

## GitHub Integration (Recommended for Production)

For production applications, we recommend integrating with GitHub instead of using Encore's managed git:

### Connecting Your GitHub Account

1. Open your app in the **Encore Cloud dashboard**
2. Navigate to Encore Cloud [GitHub Integration settings](https://app.encore.cloud/alain-ai-learning-platform-rui2/settings/integrations/github)
3. Click **Connect Account to GitHub**
4. Grant access to your repository

Once connected, pushing to your GitHub repository will automatically trigger deployments. Encore Cloud Pro users also get Preview Environments for each pull request.

### Deploy via GitHub

After connecting GitHub, deploy by pushing to your repository:

```bash
git add -A .
git commit -m "Deploy via GitHub"
git push origin main
```

## Additional Resources

- [Encore Documentation](https://encore.dev/docs)
- [Deployment Guide](https://encore.dev/docs/platform/deploy/deploying)
- [GitHub Integration](https://encore.dev/docs/platform/integrations/github)
- [Encore Cloud Dashboard](https://app.encore.dev)

### Web (Next.js + Clerk + Streaming)

1. Navigate to the web directory:
   ```bash
   cd web
   npm install
   ```

2. Create `.env.local` with:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   CLERK_SECRET_KEY=YOUR_SECRET_KEY
   # Optional if streaming directly from providers via web API route
   POE_API_KEY=YOUR_POE_API_KEY
   OPENAI_BASE_URL=https://api.openai.com/v1  # or your compatible base
   OPENAI_API_KEY=YOUR_OPENAI_KEY
   ```

3. Run the web dev server:
   ```bash
   npm run dev
   ```

The streaming API is at `POST /api/execute` and is protected by Clerk; when `stream: true` (default), it sends SSE frames with `[DONE]` sentinel and 15s heartbeats.

### Seed the Database

With the backend running locally (`encore run`), seed a sample tutorial and two steps:

```bash
curl -X POST "http://localhost:4000/seed"
```

