import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getGovernedClaim } from '@/lib/claims-governance';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const claim = await getGovernedClaim(id);

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    return NextResponse.json(claim);
  } catch (error) {
    console.error('Claim GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch claim' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request; void params;
  return NextResponse.json({ error: 'Direct claim mutation is retired; use the governed workflow endpoint', code: 'RETIRED_UNSAFE_MUTATION' }, { status: 410 });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request; void params;
  return NextResponse.json({ error: 'Direct claim mutation is retired; use the governed workflow endpoint', code: 'RETIRED_UNSAFE_MUTATION' }, { status: 410 });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  void request; void params;
  return NextResponse.json({ error: 'Claim records are retained and cannot be deleted', code: 'RETENTION_ENFORCED' }, { status: 405 });
}
