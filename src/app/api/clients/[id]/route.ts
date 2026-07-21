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

    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        agent: { select: { id: true, name: true, email: true } },
        household: { select: { id: true, name: true } },
        contacts: true,
        lifeEvents: { orderBy: { eventDate: 'desc' } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        policies: {
          include: {
            carrier: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        quotes: {
          include: {
            carrier: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        claims: {
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        customerAuth: { select: { id: true, email: true, createdAt: true } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Client GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 });
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

    const client = await prisma.client.update({
      where: { id },
      data: body,
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    await prisma.activity.create({
      data: {
        type: 'CLIENT_UPDATED',
        title: 'Client updated',
        description: `Updated client ${client.firstName} ${client.lastName}`,
        userId: session.user.id,
        clientId: client.id,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Client PUT error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
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

    // Only update specified fields
    const client = await prisma.client.update({
      where: { id },
      data: body,
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Client PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
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

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Client DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}
