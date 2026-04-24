import cron from 'node-cron';
import { executeJob } from './queue';

/**
 * Start all cron-scheduled jobs.
 * Each job executes directly via executeJob (no Redis/BullMQ).
 */
export function startScheduler() {
  console.log('[Scheduler] Starting cron jobs...');

  // Renewal check — daily at 8:00 AM
  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running renewal check...');
    await executeJob('renewal-check', {});
  });

  // Payment reminders — daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running payment dunning...');
    await executeJob('payment-dunning', {});
  });

  // Follow-up triggers — every hour
  cron.schedule('0 * * * *', async () => {
    console.log('[Cron] Running follow-up trigger...');
    await executeJob('follow-up-trigger', {});
  });

  // Campaign sender — every minute (picks up scheduled campaigns)
  cron.schedule('* * * * *', async () => {
    await executeJob('campaign-check', {});
  });

  // Compliance audit — Sundays at 2:00 AM
  cron.schedule('0 2 * * 0', async () => {
    console.log('[Cron] Running compliance audit...');
    await executeJob('compliance-audit', {});
  });

  // Commission processing — daily at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running commission processing...');
    await executeJob('commission-process', {});
  });

  // Escalation monitor — every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    await executeJob('escalation-monitor', {});
  });

  // Policy lapse check — daily at 10:00 AM
  cron.schedule('0 10 * * *', async () => {
    console.log('[Cron] Running policy lapse check...');
    await executeJob('policy-lapse', {});
  });

  // Cross-sell detection — daily at 7:00 AM
  cron.schedule('0 7 * * *', async () => {
    console.log('[Cron] Running cross-sell detection...');
    await executeJob('cross-sell-detection', {});
  });

  // Client follow-up — daily at 8:30 AM
  cron.schedule('30 8 * * *', async () => {
    console.log('[Cron] Running client follow-up...');
    await executeJob('client-follow-up', {});
  });

  // Document expiration check — daily at 9:30 AM
  cron.schedule('30 9 * * *', async () => {
    console.log('[Cron] Running document expiration check...');
    await executeJob('document-expiration', {});
  });

  console.log('[Scheduler] All cron jobs registered (11 jobs)');
}
