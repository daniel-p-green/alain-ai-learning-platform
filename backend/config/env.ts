let initialized = false;

function requireEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function isOffline(): boolean {
  const v = (process.env.OFFLINE_MODE || '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function validateBackendEnv() {
  if (initialized) return;
  initialized = true;
  const teacherProvider = (process.env.TEACHER_PROVIDER || 'poe').toLowerCase();
  const offline = isOffline();
  // OpenAI-compatible validation or gentle defaults in offline mode
  const needOpenAI = teacherProvider === 'openai-compatible' || offline;
  if (needOpenAI) {
    const hasBase = !!requireEnv('OPENAI_BASE_URL');
    const hasKey = !!requireEnv('OPENAI_API_KEY');
    if (!hasBase || !hasKey) {
      if (offline) {
        // Gentle defaults for strict offline when not provided
        if (!hasBase) process.env.OPENAI_BASE_URL = 'http://localhost:11434/v1';
        if (!hasKey) process.env.OPENAI_API_KEY = 'ollama';
        console.warn('[config] OFFLINE_MODE enabled without OPENAI_*; defaulting to OPENAI_BASE_URL=http://localhost:11434/v1 and OPENAI_API_KEY=ollama');
      } else {
        // Fail fast to avoid confusing runtime errors
        throw new Error('Config: TEACHER_PROVIDER=openai-compatible requires OPENAI_BASE_URL and OPENAI_API_KEY');
      }
    }
  }
  // Poe is optional unless 120B is requested; we do not hard fail here.
  if (!requireEnv('POE_API_KEY')) {
    console.warn('[config] POE_API_KEY not set. GPT-OSS-120B will not be available and requests will fail the routing guard.');
  }
  if (!requireEnv('CLERK_JWT_ISSUER')) {
    console.warn('[config] CLERK_JWT_ISSUER not set. JWT verification will rely on default settings.');
  }
  if (offline && teacherProvider !== 'openai-compatible') {
    console.warn('[config] OFFLINE_MODE is enabled but TEACHER_PROVIDER is not openai-compatible. For strict offline use, set TEACHER_PROVIDER=openai-compatible and run a local endpoint (e.g., Ollama).');
  }
}

// Allow runtime overrides from a setup wizard without restart
export function applyRuntimeEnv(overrides: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(overrides || {})) {
    if (typeof v === 'string') process.env[k] = v;
  }
  // Force re-validate on next call
  initialized = false;
}
