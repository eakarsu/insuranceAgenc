import prisma from './prisma';

// Job handler registry
const jobHandlers: Record<string, (data: any) => Promise<any>> = {};

export function registerJobHandler(name: string, handler: (data: any) => Promise<any>) {
  jobHandlers[name] = handler;
}

/**
 * Execute a job directly (no Redis/BullMQ required).
 * Creates a JobLog entry, runs the handler with retries, and updates the log.
 */
export async function executeJob(name: string, data: any = {}): Promise<any> {
  const handler = jobHandlers[name];
  if (!handler) {
    console.warn(`[Job] No handler registered for job: ${name}`);
    return null;
  }

  console.log(`[Job] Executing: ${name}`);

  const jobLog = await prisma.jobLog.create({
    data: {
      jobName: name,
      status: 'RUNNING',
      payload: data,
      startedAt: new Date(),
    },
  });

  const MAX_ATTEMPTS = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await handler(data);
      await prisma.jobLog.update({
        where: { id: jobLog.id },
        data: { status: 'COMPLETED', result: result ?? {}, completedAt: new Date() },
      });
      console.log(`[Job] Completed: ${name}`);
      return result;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Job] Attempt ${attempt}/${MAX_ATTEMPTS} failed for ${name}: ${error.message}`);
      if (attempt < MAX_ATTEMPTS) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  await prisma.jobLog.update({
    where: { id: jobLog.id },
    data: { status: 'FAILED', error: lastError?.message || 'Unknown error', completedAt: new Date() },
  });
  console.error(`[Job] Failed after ${MAX_ATTEMPTS} attempts: ${name}`);
  return null;
}

// Backward-compatible shim for code that references automationQueue.add()
export const automationQueue = {
  add: (name: string, data: any) => executeJob(name, data),
};
