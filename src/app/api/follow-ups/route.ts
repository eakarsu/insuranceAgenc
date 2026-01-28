import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const followUps = await prisma.quoteFollowUp.findMany({
      orderBy: { scheduledAt: 'asc' },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({ followUps });
  } catch (error) {
    console.error('Follow-ups GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch follow-ups' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const followUp = await prisma.quoteFollowUp.create({
      data: {
        quoteId: body.quoteId,
        type: body.type || 'PHONE',
        scheduledAt: new Date(body.scheduledAt),
        notes: body.notes || null,
      },
      include: {
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json(followUp, { status: 201 });
  } catch (error) {
    console.error('Follow-ups POST error:', error);
    return NextResponse.json({ error: 'Failed to create follow-up' }, { status: 500 });
  }
}
