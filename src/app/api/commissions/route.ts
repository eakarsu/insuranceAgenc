import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const commissions = await prisma.commission.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        policy: { select: { id: true, policyNumber: true, lineOfBusiness: true } },
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ commissions });
  } catch (error) {
    console.error('Commissions GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch commissions' }, { status: 500 });
  }
}
