import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { executeSettlementPayout } from '@/lib/settlement-payout';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const result = await executeSettlementPayout(id, session.user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Settlement pay error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
