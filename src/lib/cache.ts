const DEFAULT_TTL = 300; // 5 minutes (in seconds)

// In-memory cache store
const cache = new Map<string, { data: string; expiry: number }>();

export const cacheKeys = {
  reportDashboard: 'report:dashboard',
  reportPerformance: 'report:performance',
};

export async function getCached<T>(key: string): Promise<T | null> {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }

  return JSON.parse(entry.data) as T;
}

export async function setCache(key: string, data: unknown, ttl: number = DEFAULT_TTL): Promise<void> {
  cache.set(key, {
    data: JSON.stringify(data),
    expiry: Date.now() + ttl * 1000,
  });
}

export async function invalidateCache(pattern: string): Promise<void> {
  // Simple pattern matching: support trailing * wildcard
  const prefix = pattern.replace(/\*$/, '');
  const keys = Array.from(cache.keys());
  for (const key of keys) {
    if (key === pattern || key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}
