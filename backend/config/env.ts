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
}

