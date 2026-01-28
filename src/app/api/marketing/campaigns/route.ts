import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { recipients: true } },
      },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Campaigns GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    const campaign = await prisma.campaign.create({
      data: {
        ...body,
        status: 'DRAFT',
        createdById: session.user.id,
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error('Campaigns POST error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }
}
