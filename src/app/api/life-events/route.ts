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

    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId') || '';
    const type = searchParams.get('type') || '';
    const completed = searchParams.get('completed');

    const where: any = {};

    if (clientId) {
      where.clientId = clientId;
    }

    if (type) {
      where.type = type;
    }

    if (completed !== null && completed !== '') {
      where.isCompleted = completed === 'true';
    }

    const events = await prisma.lifeEvent.findMany({
      where,
      orderBy: { eventDate: 'asc' },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Life events GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch life events' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const event = await prisma.lifeEvent.create({
      data: {
        clientId: body.clientId,
        type: body.type,
        title: body.title,
        description: body.description || null,
        eventDate: new Date(body.eventDate),
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        isCompleted: body.isCompleted || false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Life events POST error:', error);
    return NextResponse.json({ error: 'Failed to create life event' }, { status: 500 });
  }
}
