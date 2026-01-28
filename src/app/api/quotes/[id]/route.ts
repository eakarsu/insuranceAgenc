import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        carrier: true,
        agent: { select: { id: true, name: true, email: true } },
        proposal: true,
        followUps: { orderBy: { scheduledAt: 'asc' } },
        activities: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Quote GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const quote = await prisma.quote.update({ where: { id }, data: body });
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Quote PUT error:', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const quote = await prisma.quote.update({ where: { id }, data: body });
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Quote PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update quote' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    await prisma.quote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quote DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete quote' }, { status: 500 });
  }
}
