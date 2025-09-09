let initialized = false;

function requireEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function validateBackendEnv() {
  if (initialized) return;
  initialized = true;
  const teacherProvider = (process.env.TEACHER_PROVIDER || 'poe').toLowerCase();
  if (teacherProvider === 'openai-compatible') {
    if (!requireEnv('OPENAI_BASE_URL') || !requireEnv('OPENAI_API_KEY')) {
      // Fail fast to avoid confusing runtime errors
      throw new Error('Config: TEACHER_PROVIDER=openai-compatible requires OPENAI_BASE_URL and OPENAI_API_KEY');
    }
  }
  // Poe is optional unless 120B is requested; we do not hard fail here.
  if (!requireEnv('POE_API_KEY')) {
    console.warn('[config] POE_API_KEY not set. GPT-OSS-120B will not be available and requests will fail the routing guard.');
  }
  if (!requireEnv('CLERK_JWT_ISSUER')) {
    console.warn('[config] CLERK_JWT_ISSUER not set. JWT verification will rely on default settings.');
  }
}
