import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { notes: { orderBy: { createdAt: 'asc' } } },
    });

    if (!complaint) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(complaint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch complaint' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();

    const updateData: any = { ...body };
    if (body.status === 'RESOLVED') {
      updateData.resolvedAt = new Date();
      updateData.resolvedBy = session.user.name || session.user.id;
    }

    const complaint = await prisma.complaint.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(complaint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update complaint' }, { status: 500 });
  }
}
