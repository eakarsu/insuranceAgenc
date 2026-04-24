import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const rateTableId = request.nextUrl.searchParams.get('rateTableId');
    const where: any = {};
    if (rateTableId) where.rateTableId = rateTableId;

    const factors = await prisma.rateFactor.findMany({
      where,
      include: { rateTable: { select: { lineOfBusiness: true } } },
      orderBy: { priority: 'desc' },
    });

    return NextResponse.json(factors);
  } catch (error) {
    console.error('Rate factors GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch rate factors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const factor = await prisma.rateFactor.create({
      data: {
        rateTableId: body.rateTableId,
        category: body.category,
        condition: body.condition,
        multiplier: body.multiplier ?? 1.0,
        flatAmount: body.flatAmount ?? 0,
        priority: body.priority ?? 0,
        description: body.description || null,
      },
    });

    return NextResponse.json(factor, { status: 201 });
  } catch (error) {
    console.error('Rate factors POST error:', error);
    return NextResponse.json({ error: 'Failed to create rate factor' }, { status: 500 });
  }
}
