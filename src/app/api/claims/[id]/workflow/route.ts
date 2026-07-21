import { NextRequest, NextResponse } from 'next/server';
import { getClaimActor } from '@/lib/claims-auth';
import { applyClaimAction } from '@/lib/claims-governance';
import { ClaimGovernanceError } from '@/lib/claims-governance-rules';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await getClaimActor();
    const { id } = await params;
    const body = await request.json();
    const externalEventId = request.headers.get('idempotency-key') || body.externalEventId;
    const result = await applyClaimAction(id, { ...body, externalEventId }, actor);
    return NextResponse.json({ ...result.claim, idempotent: result.idempotent });
  } catch (error) {
    console.error('Claim workflow error:', error);
    if (error instanceof ClaimGovernanceError) {
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: error.status });
    }
    return NextResponse.json({ error: 'Claim workflow action failed', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
