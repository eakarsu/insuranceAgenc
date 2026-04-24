import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { adviseCoverage } from '@/lib/ai-agent';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId } = body as { clientId: string };

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const result = await adviseCoverage(clientId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Coverage advisor error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze coverage' },
      { status: 500 }
    );
  }
}
