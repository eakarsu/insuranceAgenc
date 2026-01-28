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

    const policy = await prisma.policy.findUnique({
      where: { id },
      include: {
        client: true,
        carrier: true,
        agent: { select: { id: true, name: true, email: true } },
        endorsements: { orderBy: { effectiveDate: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        claims: { orderBy: { dateOfLoss: 'desc' } },
        commissions: { orderBy: { earnedDate: 'desc' } },
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Policy GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch policy' }, { status: 500 });
  }
}

export async function PUT(
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

    const policy = await prisma.policy.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error('Policy PUT error:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.policy.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Policy DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
  }
}
