// Predictive churn + retention orchestration (life-events + sentiment + outreach).
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function churnScore(p: any): number {
  let s = 0;
  if ((p.daysToRenewal || 365) < 30) s += 0.3;
  if (p.complaintsLast90Days) s += 0.25;
  if (p.priceIncreaseAtRenewal && p.priceIncreaseAtRenewal > 0.07) s += 0.25;
  if ((p.lifeEvents || []).length) s += 0.2;
  return Number(Math.min(1, s).toFixed(2));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { action } = body;

  if (action === 'score') {
    let policies: any[] = body.policies;
    if (!policies) {
      try { policies = await (prisma as any).policy.findMany({ take: 500 }); } catch { policies = []; }
    }
    const scored = policies.map((p: any) => ({ id: p.id, name: p.clientName || p.client?.name, score: churnScore(p) }))
      .sort((a, b) => b.score - a.score);
    return NextResponse.json({ count: scored.length, atRisk: scored.filter(x => x.score >= 0.5) });
  }

  if (action === 'queue-outreach') {
    const { policyIds = [], playbook = 'renewal_save' } = body;
    return NextResponse.json({ queued: policyIds.length, playbook, note: 'Wire to notification-service to actually send.' });
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
