import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const result = await prisma.claim.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({
      message: `${result.count} claim(s) deleted successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Bulk delete claims error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ids, data } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }

    const allowedFields = ['status'];
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    const result = await prisma.claim.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return NextResponse.json({
      message: `${result.count} claim(s) updated successfully`,
      count: result.count,
    });
  } catch (error) {
    console.error('Bulk update claims error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
