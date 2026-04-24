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

    const rule = await prisma.complianceRule.findUnique({
      where: { id },
      include: {
        checks: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Compliance rule not found' }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('ComplianceRule GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance rule' }, { status: 500 });
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const rule = await prisma.complianceRule.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.lineOfBusiness !== undefined && { lineOfBusiness: body.lineOfBusiness }),
        ...(body.requirement !== undefined && { requirement: body.requirement }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.severity !== undefined && { severity: body.severity }),
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('ComplianceRule PUT error:', error);
    return NextResponse.json({ error: 'Failed to update compliance rule' }, { status: 500 });
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

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.complianceRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ComplianceRule DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete compliance rule' }, { status: 500 });
  }
}
