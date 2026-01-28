import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        client: true,
        policy: { include: { carrier: true } },
        agent: { select: { id: true, name: true, email: true } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        communications: { orderBy: { createdAt: 'desc' } },
        settlements: { orderBy: { createdAt: 'desc' } },
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });
    return NextResponse.json(claim);
  } catch (error) {
    console.error('Claim GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch claim' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const claim = await prisma.claim.update({ where: { id }, data: body });

    await prisma.activity.create({
      data: {
        type: 'CLAIM_UPDATED',
        title: 'Claim updated',
        description: `Updated claim ${claim.claimNumber}`,
        userId: session.user.id,
        clientId: claim.clientId,
        claimId: claim.id,
      },
    });

    return NextResponse.json(claim);
  } catch (error) {
    console.error('Claim PUT error:', error);
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const claim = await prisma.claim.update({ where: { id }, data: body });

    await prisma.activity.create({
      data: {
        type: 'CLAIM_UPDATED',
        title: 'Claim status updated',
        description: `Updated claim ${claim.claimNumber}`,
        userId: session.user.id,
        clientId: claim.clientId,
        claimId: claim.id,
      },
    });

    return NextResponse.json(claim);
  } catch (error) {
    console.error('Claim PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.claim.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Claim DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete claim' }, { status: 500 });
  }
}
