/**
 * Redis client with graceful in-memory fallback.
 *
 * If REDIS_URL is set and ioredis is available, uses Redis.
 * Otherwise falls back to an in-memory store — suitable for development
 * and serverless deployments where Redis is optional.
 *
 * Features that degrade gracefully without Redis:
 *   - Rate limiting  → in-memory Map (already implemented in rate-limit.ts)
 *   - Response cache → in-memory Map (already implemented in cache.ts)
 *   - Session store  → database (NextAuth default)
 *   - Queue          → in-memory queue (queue.ts)
 *
 * This module logs which mode is active at startup.
 */

type RedisValue = string | null;

interface RedisLike {
  get(key: string): Promise<RedisValue>;
  set(key: string, value: string, ...args: any[]): Promise<void>;
  del(...keys: string[]): Promise<void>;
  keys(pattern: string): Promise<string[]>;
  on(event: string, callback: (...args: any[]) => void): RedisLike;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  quit(): Promise<void>;
  status: string;
  mode: 'redis' | 'memory';
  isHealthy(): Promise<boolean>;
}

// ── In-memory fallback store ──────────────────────────────────────────────────

const memStore = new Map<string, { value: string; expiry: number | null }>();

function memGet(key: string): string | null {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (entry.expiry !== null && Date.now() > entry.expiry) {
    memStore.delete(key);
    return null;
  }
  return entry.value;
}

function memSet(key: string, value: string, ...args: any[]): void {
  let expiry: number | null = null;
  // Support: SET key value EX seconds
  const exIdx = args.findIndex((a) => typeof a === 'string' && a.toUpperCase() === 'EX');
  if (exIdx !== -1 && args[exIdx + 1]) {
    expiry = Date.now() + Number(args[exIdx + 1]) * 1000;
  }
  // Support: SET key value PX milliseconds
  const pxIdx = args.findIndex((a) => typeof a === 'string' && a.toUpperCase() === 'PX');
  if (pxIdx !== -1 && args[pxIdx + 1]) {
    expiry = Date.now() + Number(args[pxIdx + 1]);
  }
  // Support object form: { ex: seconds } or { px: ms }
  const opts = args.find((a) => a && typeof a === 'object');
  if (opts?.ex) expiry = Date.now() + Number(opts.ex) * 1000;
  if (opts?.px) expiry = Date.now() + Number(opts.px);

  memStore.set(key, { value, expiry });
}

// Periodically clean expired keys
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memStore.forEach((entry, key) => {
      if (entry.expiry !== null && now > entry.expiry) {
        memStore.delete(key);
      }
    });
  }, 60_000);
}

// ── In-memory client ──────────────────────────────────────────────────────────

const memoryClient: RedisLike = {
  mode: 'memory',
  status: 'ready',

  async get(key: string) {
    return memGet(key);
  },
  async set(key: string, value: string, ...args: any[]) {
    memSet(key, value, ...args);
  },
  async del(...keys: string[]) {
    for (const k of keys) memStore.delete(k);
  },
  async keys(pattern: string) {
    // Simple glob: support trailing * only
    const prefix = pattern.replace(/\*$/, '');
    return Array.from(memStore.keys()).filter((k) =>
      pattern.endsWith('*') ? k.startsWith(prefix) : k === pattern
    );
  },
  on(_event: string, _callback: (...args: any[]) => void) {
    return memoryClient;
  },
  async connect() {},
  async disconnect() {},
  async quit() {},
  async isHealthy() {
    return true;
  },
};

// ── Redis client (optional) ───────────────────────────────────────────────────

async function tryCreateRedisClient(): Promise<RedisLike | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    // Dynamically require ioredis so the app doesn't crash if it's not installed
    const { default: Redis } = await import('ioredis' as any);
    const client = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
    });

    await client.connect();

    const realClient: RedisLike = {
      mode: 'redis',
      status: 'ready',
      async get(key) { return client.get(key); },
      async set(key, value, ...args) { await (client.set as any)(key, value, ...args); },
      async del(...keys) { await client.del(...keys); },
      async keys(pattern) { return client.keys(pattern); },
      on(event, cb) { client.on(event, cb); return realClient; },
      async connect() { await client.connect(); },
      async disconnect() { await client.disconnect(); },
      async quit() { await client.quit(); },
      async isHealthy() {
        try { await client.ping(); return true; } catch { return false; }
      },
    };

    return realClient;
  } catch (err) {
    console.warn('[redis] Failed to connect to Redis — falling back to in-memory store:', err);
    return null;
  }
}

// ── Singleton resolution ──────────────────────────────────────────────────────

let resolvedClient: RedisLike | null = null;
let initPromise: Promise<void> | null = null;

async function initialize(): Promise<void> {
  const redisClient = await tryCreateRedisClient();
  if (redisClient) {
    resolvedClient = redisClient;
    console.log('[redis] Connected to Redis — using Redis store');
  } else {
    resolvedClient = memoryClient;
    if (process.env.REDIS_URL) {
      console.warn('[redis] REDIS_URL is set but connection failed — using in-memory store');
    } else {
      console.log('[redis] No REDIS_URL configured — using in-memory store (rate limiting, caching)');
    }
  }
}

// Initialize on first import (non-blocking; uses fallback until ready)
initPromise = initialize();

/**
 * Proxy that always routes through the resolved client.
 * Falls back to in-memory while initialization is in progress.
 */
const redis: RedisLike = {
  get mode() { return (resolvedClient ?? memoryClient).mode; },
  get status() { return (resolvedClient ?? memoryClient).status; },

  async get(key) { return (resolvedClient ?? memoryClient).get(key); },
  async set(key, value, ...args) { return (resolvedClient ?? memoryClient).set(key, value, ...args); },
  async del(...keys) { return (resolvedClient ?? memoryClient).del(...keys); },
  async keys(pattern) { return (resolvedClient ?? memoryClient).keys(pattern); },
  on(event, cb) { (resolvedClient ?? memoryClient).on(event, cb); return redis; },
  async connect() { await initPromise; },
  async disconnect() { if (resolvedClient) await resolvedClient.disconnect(); },
  async quit() { if (resolvedClient) await resolvedClient.quit(); },
  async isHealthy() { return (resolvedClient ?? memoryClient).isHealthy(); },
};

export { redis };
export default redis;
