/**
 * Next.js Instrumentation Hook
 * Starts the background scheduler on server boot.
 * Jobs execute directly (no Redis/BullMQ).
 */
export async function register() {
  // Only run on the server (Node.js runtime)
  if (typeof window !== 'undefined') return;
  if (process.env.ENABLE_BACKGROUND_JOBS !== 'true') {
    console.log('[Instrumentation] Background jobs disabled; run them only in a designated worker deployment');
    return;
  }

  try {
    // Dynamically import to avoid bundling issues
    const { startScheduler } = await import('./lib/scheduler');
    const { registerJobHandler } = await import('./lib/queue');

    // Register all job handlers
    const { handleCampaignSender } = await import('./lib/jobs/campaign-sender');
    const { handleFollowUpTrigger } = await import('./lib/jobs/follow-up-trigger');
    const { handleRenewalCheck } = await import('./lib/jobs/renewal-check');
    const { handlePaymentDunning } = await import('./lib/jobs/payment-dunning');
    const { handlePolicyLapse } = await import('./lib/jobs/policy-lapse');
    const { handleComplianceAudit } = await import('./lib/jobs/compliance-audit');
    const { handleCommissionProcess } = await import('./lib/jobs/commission-process');
    const { handleEscalationMonitor } = await import('./lib/jobs/escalation-monitor');
    const { handleCrossSellDetection } = await import('./lib/jobs/cross-sell-detection');
    const { handleClientFollowUp } = await import('./lib/jobs/client-follow-up');
    const { handleDocumentExpiration } = await import('./lib/jobs/document-expiration');

    registerJobHandler('send-campaign', handleCampaignSender);
    registerJobHandler('campaign-check', handleCampaignSender);
    registerJobHandler('follow-up-trigger', handleFollowUpTrigger);
    registerJobHandler('renewal-check', handleRenewalCheck);
    registerJobHandler('payment-dunning', handlePaymentDunning);
    registerJobHandler('policy-lapse', handlePolicyLapse);
    registerJobHandler('compliance-audit', handleComplianceAudit);
    registerJobHandler('commission-process', handleCommissionProcess);
    registerJobHandler('escalation-monitor', handleEscalationMonitor);
    registerJobHandler('cross-sell-detection', handleCrossSellDetection);
    registerJobHandler('client-follow-up', handleClientFollowUp);
    registerJobHandler('document-expiration', handleDocumentExpiration);

    // Start scheduler (no BullMQ worker needed)
    startScheduler();

    console.log('[Instrumentation] Background services started (11 cron jobs, no Redis)');
  } catch (error) {
    console.warn('[Instrumentation] Failed to start background services:', error);
  }
}
