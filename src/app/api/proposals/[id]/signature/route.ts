import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    const audits = await prisma.signatureAudit.findMany({
      where: { proposalId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ audits });
  } catch (error) {
    console.error('Signature audit GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch signature audit trail' }, { status: 500 });
  }
}
