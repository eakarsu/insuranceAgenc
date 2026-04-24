import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewClaim } from '@/lib/ai-agent';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { claimId } = body as { claimId: string };

    if (!claimId) {
      return NextResponse.json({ error: 'claimId is required' }, { status: 400 });
    }

    const result = await reviewClaim(claimId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Claims review error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to review claim' },
      { status: 500 }
    );
  }
}
