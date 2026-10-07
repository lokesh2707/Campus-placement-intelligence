import { env } from '../config/env.js';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  timestamp: string;
  level: LogLevel;
  service: string;
  requestId?: string;
  message: string;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'secret',
  'cookie',
]);

function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitize(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export const logger = {
  log(level: LogLevel, message: string, meta: Record<string, unknown> = {}, requestId?: string): void {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      service: 'placement-api',
      requestId,
      message,
      ...(sanitize(meta) as Record<string, unknown>),
    };

    if (env.NODE_ENV === 'production') {
      console.log(JSON.stringify(payload));
    } else {
      const reqTag = requestId ? `[${requestId.slice(0, 8)}] ` : '';
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(sanitize(meta))}` : '';
      const prefix = {
        info: 'ℹ️ [INFO]',
        warn: '⚠️ [WARN]',
        error: '❌ [ERROR]',
        debug: '🔍 [DEBUG]',
      }[level];

      console.log(`${payload.timestamp} ${prefix} ${reqTag}${message}${metaStr}`);
    }
  },

  info(message: string, meta: Record<string, unknown> = {}, requestId?: string): void {
    this.log('info', message, meta, requestId);
  },

  warn(message: string, meta: Record<string, unknown> = {}, requestId?: string): void {
    this.log('warn', message, meta, requestId);
  },

  error(message: string, meta: Record<string, unknown> = {}, requestId?: string): void {
    this.log('error', message, meta, requestId);
  },

  debug(message: string, meta: Record<string, unknown> = {}, requestId?: string): void {
    if (env.NODE_ENV !== 'production') {
      this.log('debug', message, meta, requestId);
    }
  },
};
