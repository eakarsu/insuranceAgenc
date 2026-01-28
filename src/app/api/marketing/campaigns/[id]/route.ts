import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        recipients: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Campaign GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const campaign = await prisma.campaign.update({ where: { id }, data: body });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Campaign PUT error:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const updateData: any = { ...body };

    // If status is changing to SENDING, set sentAt
    if (body.status === 'SENDING') {
      updateData.sentAt = new Date();
      // Simulate sending - immediately mark as SENT
      updateData.status = 'SENT';
    }

    const campaign = await prisma.campaign.update({ where: { id }, data: updateData });
    return NextResponse.json(campaign);
  } catch (error) {
    console.error('Campaign PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Campaign DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }
}
