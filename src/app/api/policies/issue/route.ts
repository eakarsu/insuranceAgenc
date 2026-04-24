import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { bindAndIssuePolicy } from '@/lib/policy-issuance';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { quoteId } = body;

    if (!quoteId) {
      return NextResponse.json({ error: 'quoteId is required' }, { status: 400 });
    }

    const result = await bindAndIssuePolicy(quoteId, session.user.id);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Policy issue POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to issue policy' },
      { status: 500 }
    );
  }
}
