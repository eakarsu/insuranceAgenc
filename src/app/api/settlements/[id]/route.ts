import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const settlement = await prisma.settlement.findUnique({
      where: { id },
      include: {
        claim: {
          include: {
            client: { select: { firstName: true, lastName: true, email: true } },
            policy: { select: { policyNumber: true } },
          },
        },
      },
    });

    if (!settlement) return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    return NextResponse.json(settlement);
  } catch (error) {
    console.error('Settlement GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch settlement' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const settlement = await prisma.settlement.update({
      where: { id },
      data: {
        ...body,
        ...(body.status === 'APPROVED' ? { approvedBy: session.user.id, approvedAt: new Date() } : {}),
      },
    });

    return NextResponse.json(settlement);
  } catch (error) {
    console.error('Settlement PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
  }
}
