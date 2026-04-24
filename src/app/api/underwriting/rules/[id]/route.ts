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

    const rule = await prisma.underwritingRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('UnderwritingRule GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch underwriting rule' }, { status: 500 });
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

    const rule = await prisma.underwritingRule.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.lineOfBusiness !== undefined && { lineOfBusiness: body.lineOfBusiness }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.field !== undefined && { field: body.field }),
        ...(body.operator !== undefined && { operator: body.operator }),
        ...(body.value !== undefined && { value: body.value }),
        ...(body.riskPoints !== undefined && { riskPoints: parseInt(String(body.riskPoints)) }),
        ...(body.priority !== undefined && { priority: parseInt(String(body.priority)) }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      },
    });

    return NextResponse.json(rule);
  } catch (error) {
    console.error('UnderwritingRule PUT error:', error);
    return NextResponse.json({ error: 'Failed to update underwriting rule' }, { status: 500 });
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

    await prisma.underwritingRule.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('UnderwritingRule DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete underwriting rule' }, { status: 500 });
  }
}
