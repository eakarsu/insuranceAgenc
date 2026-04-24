import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const escalation = await prisma.escalation.findUnique({ where: { id } });
    if (!escalation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json(escalation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch escalation' }, { status: 500 });
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
    }

    const escalation = await prisma.escalation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(escalation);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update escalation' }, { status: 500 });
  }
}
