import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const check = await prisma.complianceCheck.findUnique({
      where: { id },
      include: { rule: true },
    });

    if (!check) {
      return NextResponse.json({ error: 'Compliance check not found' }, { status: 404 });
    }

    return NextResponse.json(check);
  } catch (error) {
    console.error('ComplianceCheck GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance check' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const check = await prisma.complianceCheck.update({
      where: { id },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.evidence !== undefined && { evidence: body.evidence }),
        ...(body.status && { checkedAt: new Date(), checkedBy: session.user.name || session.user.id }),
      },
      include: { rule: true },
    });

    return NextResponse.json(check);
  } catch (error) {
    console.error('ComplianceCheck PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update compliance check' }, { status: 500 });
  }
}
