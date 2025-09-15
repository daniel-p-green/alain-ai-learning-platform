// Lightweight observability utilities: structured logging, basic metrics, and helpers
// ESM-compatible, zero external deps.

import os from 'node:os';
import { monitorEventLoopDelay } from 'node:perf_hooks';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
const SERVICE = process.env.SERVICE_NAME || process.env.ENCORE_SERVICE || 'backend';

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
  const base = { service: SERVICE, component };
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

// Basic in-memory metrics
type Labels = Record<string, string | number | boolean> | undefined;

const counters = new Map<string, number>();
const samples = new Map<string, number[]>(); // ring buffer-esque; capped length
const SAMPLE_CAP = Number(process.env.METRICS_SAMPLE_SIZE || 512);

function keyWithLabels(name: string, labels?: Labels) {
  if (!labels) return name;
  const parts = Object.keys(labels)
    .sort()
    .map(k => `${k}=${String(labels[k])}`)
    .join(',');
  return `${name}{${parts}}`;
}

export const metrics = {
  inc(name: string, by = 1, labels?: Labels) {
    const key = keyWithLabels(name, labels);
    counters.set(key, (counters.get(key) || 0) + by);
  },
  observe(name: string, value: number, labels?: Labels) {
    const key = keyWithLabels(name, labels);
    const arr = samples.get(key) || [];
    arr.push(value);
    if (arr.length > SAMPLE_CAP) arr.shift();
    samples.set(key, arr);
  },
  snapshot() {
    const countersObj: Record<string, number> = {};
    counters.forEach((v, k) => (countersObj[k] = v));

    const timers: Record<string, { count: number; avg: number; p50: number; p95: number; p99: number; min: number; max: number }> = {};
    samples.forEach((arr, k) => {
      if (arr.length === 0) return;
      const sorted = [...arr].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
      timers[k] = {
        count: sorted.length,
        avg: sum / sorted.length,
        p50: pct(50),
        p95: pct(95),
        p99: pct(99),
        min: sorted[0],
        max: sorted[sorted.length - 1],
      };
    });
    return { counters: countersObj, timers };
  },
};

// Event loop delay monitor
const loopDelay = monitorEventLoopDelay({ resolution: 20 });
loopDelay.enable();

export function systemMetrics() {
  const mem = process.memoryUsage();
  const load = os.loadavg();
  const nsToMs = (n: number) => n / 1e6;
  const p = (x: number) => nsToMs(loopDelay.percentile(x));
  return {
    pid: process.pid,
    uptime_s: process.uptime(),
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed,
      external: (mem as any).external,
    },
    cpu: { load1: load[0], load5: load[1], load15: load[2] },
    eventLoopDelay_ms: { p50: p(50), p95: p(95), p99: p(99), max: nsToMs(loopDelay.max) },
    node: { version: process.version, platform: process.platform },
  };
}

// Export concrete types (avoid ReturnType for wider tool/TS lib compatibility)
export interface SystemMetrics {
  pid: number;
  uptime_s: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external?: number;
  };
  cpu: { load1: number; load5: number; load15: number };
  eventLoopDelay_ms: { p50: number; p95: number; p99: number; max: number };
  node: { version: string; platform: string };
}

export interface MetricsSnapshot {
  counters: Record<string, number>;
  timers: Record<
    string,
    { count: number; avg: number; p50: number; p95: number; p99: number; min: number; max: number }
  >;
}

export async function timeIt<T>(name: string, fn: () => Promise<T> | T, labels?: Labels): Promise<T> {
  const start = Date.now();
  try {
    const out = fn();
    const result = out instanceof Promise ? await out : out;
    const dur = Date.now() - start;
    metrics.observe(`${name}_duration_ms`, dur, labels);
    return result;
  } catch (err) {
    const dur = Date.now() - start;
    metrics.observe(`${name}_duration_ms`, dur, { ...(labels || {}), error: true });
    throw err;
  }
}

export function trackEvent(name: string, props?: Record<string, any>) {
  const log = createLogger('event');
  log.info(name, props);
}

// Encore API wrapper for request/response logging and timing
export function withApiLogging<Req, Res>(name: string, handler: (req: Req, ctx: any) => Promise<Res> | Res) {
  const log = createLogger(name);
  const slowMs = Number(process.env.SLOW_THRESHOLD_MS || 750);
  return async (req: Req, ctx: any): Promise<Res> => {
    const start = Date.now();
    log.info('request', sanitize({ query: req }));
    try {
      const result = await handler(req, ctx);
      const dur = Date.now() - start;
      metrics.observe(`${name}_latency_ms`, dur);
      metrics.inc(`${name}_total`, 1);
      if (dur > slowMs) log.warn('slow_request', { duration_ms: dur });
      log.debug('response', { duration_ms: dur });
      return result;
    } catch (error: any) {
      const dur = Date.now() - start;
      metrics.observe(`${name}_latency_ms`, dur, { error: true });
      metrics.inc(`${name}_errors_total`, 1);
      log.error('error', { duration_ms: dur, error: error?.message || String(error) });
      throw error;
    }
  };
}

function sanitize(obj: any) {
  try {
    const json = JSON.stringify(obj);
    if (json.length > 2000) return { truncated: true };
    // Avoid logging obvious secrets
    return JSON.parse(json, (k, v) => (typeof v === 'string' && /key|token|secret/i.test(k) ? '***' : v));
  } catch {
    return { note: 'unserializable' };
  }
}
