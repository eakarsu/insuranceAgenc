import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request; void params;
  return NextResponse.json({ error: 'Legacy settlement payout is retired; authorize and reconcile payment through the claim workflow', code: 'RETIRED_UNSAFE_PAYOUT' }, { status: 410 });
}
