import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const referral = await prisma.referral.findUnique({
      where: { id },
      include: {
        referringClient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        referredClient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            status: true,
            policies: { select: { id: true } },
          },
        },
      },
    });

    if (!referral) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
    return NextResponse.json(referral);
  } catch (error) {
    console.error('Referral GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch referral' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const referral = await prisma.referral.update({
      where: { id },
      data: {
        status: body.status,
        rewardGiven: body.rewardGiven,
        rewardAmount: body.rewardAmount,
        notes: body.notes,
      },
      include: {
        referringClient: { select: { id: true, firstName: true, lastName: true } },
        referredClient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(referral);
  } catch (error) {
    console.error('Referral PUT error:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const referral = await prisma.referral.update({
      where: { id },
      data: body,
      include: {
        referringClient: { select: { id: true, firstName: true, lastName: true } },
        referredClient: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(referral);
  } catch (error) {
    console.error('Referral PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.referral.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Referral DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete referral' }, { status: 500 });
  }
}
