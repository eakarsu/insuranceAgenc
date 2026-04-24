import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const commission = await prisma.commission.findUnique({ where: { id } });
    if (!commission) return NextResponse.json({ error: 'Commission not found' }, { status: 404 });
    if (commission.status !== 'EARNED') {
      return NextResponse.json({ error: 'Commission must be in EARNED status to pay' }, { status: 400 });
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Commission pay error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
