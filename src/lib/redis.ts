// No-op Redis stub — Redis dependency removed for standalone operation

const noop = () => {};

const redis = {
  get: async (_key: string): Promise<string | null> => null,
  set: async (_key: string, _value: string, ..._args: any[]): Promise<void> => {},
  del: async (..._keys: string[]): Promise<void> => {},
  keys: async (_pattern: string): Promise<string[]> => [],
  on: (_event: string, _callback: (...args: any[]) => void) => redis,
  connect: async () => {},
  disconnect: async () => {},
  quit: async () => {},
  status: 'ready' as const,
};

export { redis };
export default redis;
