import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

import { authOptions } from '@/lib/auth';
import { requestClaimOperationalReadiness } from '@/lib/openrouter-evidence';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await request.json().catch(() => ({})) as { workflowSummary?: unknown };
    const workflowSummary = typeof body.workflowSummary === 'string' ? body.workflowSummary.trim() : '';
    if (workflowSummary.length < 10 || workflowSummary.length > 1000) {
      return NextResponse.json({ error: 'workflowSummary must contain 10-1000 characters' }, { status: 400 });
    }
    const startedAt = Date.now();
    const evidence = await requestClaimOperationalReadiness(workflowSummary);
    const result = await prisma.aiResult.create({
      data: {
        feature: 'claim_operational_readiness',
        refType: 'ClaimWorkflow',
        userId: session.user.id,
        model: evidence.providerReceipt.model,
        input: { workflowSummary },
        output: { result: evidence.result, providerReceipt: evidence.providerReceipt },
        rawText: evidence.result,
        durationMs: Date.now() - startedAt,
      },
      select: { id: true, createdAt: true },
    });
    return NextResponse.json({ analysisId: result.id, createdAt: result.createdAt, ...evidence });
  } catch (error) {
    console.error('Claim operational readiness error:', error);
    return NextResponse.json({ error: 'AI provider request failed' }, { status: 502 });
  }
}
