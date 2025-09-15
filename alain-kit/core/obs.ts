// Minimal observability helpers for ALAIN-Kit core (no external deps)
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const LOG_LEVEL = (process.env.ALAIN_LOG_LEVEL || process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;

function shouldLog(level: LogLevel) {
  return LEVELS[level] >= (LEVELS[LOG_LEVEL] ?? 20);
}

export interface Logger {
  debug: (msg: string, ctx?: Record<string, any>) => void;
  info: (msg: string, ctx?: Record<string, any>) => void;
  warn: (msg: string, ctx?: Record<string, any>) => void;
  error: (msg: string, ctx?: Record<string, any>) => void;
}

export function createLogger(component: string): Logger {
  const base = { component };
  const emit = (level: LogLevel, msg: string, ctx?: Record<string, any>) => {
    if (!shouldLog(level)) return;
    const payload = { ts: new Date().toISOString(), level, msg, ...base, ...(ctx || {}) };
    const line = JSON.stringify(payload);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  };
  return {
    debug: (msg, ctx) => emit('debug', msg, ctx),
    info: (msg, ctx) => emit('info', msg, ctx),
    warn: (msg, ctx) => emit('warn', msg, ctx),
    error: (msg, ctx) => emit('error', msg, ctx),
  };
}

export async function timeIt<T>(name: string, fn: () => Promise<T> | T, ctx?: Record<string, any>): Promise<T> {
  const log = createLogger(name);
  const start = Date.now();
  try {
    const out = fn();
    const result = out instanceof Promise ? await out : out;
    const dur = Date.now() - start;
    log.info('timing', { duration_ms: dur, ...(ctx || {}) });
    return result;
  } catch (error: any) {
    const dur = Date.now() - start;
    log.error('error', { duration_ms: dur, error: error?.message || String(error), ...(ctx || {}) });
    throw error;
  }
}

export function trackEvent(name: string, props?: Record<string, any>) {
  const log = createLogger('event');
  log.info(name, props);
}

// Minimal, browser-safe metrics collector
type Labels = Record<string, string | number | boolean> | undefined;

const counters = new Map<string, number>();
const timers = new Map<string, number[]>();
const SAMPLE_CAP = 512;

function key(name: string, labels?: Labels) {
  if (!labels) return name;
  const parts = Object.keys(labels)
    .sort()
    .map(k => `${k}=${String(labels[k])}`)
    .join(',');
  return `${name}{${parts}}`;
}

export const metrics = {
  inc(name: string, by = 1, labels?: Labels) {
    const k = key(name, labels);
    counters.set(k, (counters.get(k) || 0) + by);
  },
  observe(name: string, value: number, labels?: Labels) {
    const k = key(name, labels);
    const arr = timers.get(k) || [];
    arr.push(value);
    if (arr.length > SAMPLE_CAP) arr.shift();
    timers.set(k, arr);
  },
  snapshot() {
    const c: Record<string, number> = {};
    counters.forEach((v, k) => (c[k] = v));
    const t: Record<string, { count: number; avg: number; min: number; max: number; p50: number; p95: number }> = {};
    timers.forEach((arr, k) => {
      if (arr.length === 0) return;
      const s = [...arr].sort((a, b) => a - b);
      const sum = s.reduce((a, b) => a + b, 0);
      const pct = (p: number) => s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
      t[k] = { count: s.length, avg: sum / s.length, min: s[0], max: s[s.length - 1], p50: pct(50), p95: pct(95) };
    });
    return { counters: c, timers: t };
  },
  reset() {
    counters.clear();
    timers.clear();
  }
};
