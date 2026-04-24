import { NextRequest, NextResponse } from 'next/server';
import { automationQueue } from '@/lib/queue';

const CRON_API_KEY = process.env.CRON_API_KEY;

/**
 * HTTP-triggered cron endpoint for Vercel/external cron services.
 * Secured with API key authentication.
 */
export async function GET(request: NextRequest) {
  // Authenticate
  const apiKey = request.headers.get('x-api-key') || request.nextUrl.searchParams.get('key');
  if (CRON_API_KEY && apiKey !== CRON_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const job = request.nextUrl.searchParams.get('job');

  try {
    const validJobs = [
      'renewal-check',
      'payment-dunning',
      'follow-up-trigger',
      'campaign-check',
      'compliance-audit',
      'commission-process',
      'escalation-monitor',
      'policy-lapse',
      'cross-sell-detection',
      'client-follow-up',
      'document-expiration',
    ];

    if (job && validJobs.includes(job)) {
      await automationQueue.add(job, {});
      return NextResponse.json({ success: true, job });
    }

    // Run all jobs if no specific job requested
    const results = await Promise.allSettled(
      validJobs.map((j) => automationQueue.add(j, {}))
    );

    return NextResponse.json({
      success: true,
      jobs: validJobs.map((j, i) => ({
        name: j,
        status: results[i].status,
      })),
    });
  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
