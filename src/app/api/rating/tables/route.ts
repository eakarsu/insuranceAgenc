import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tables = await prisma.rateTable.findMany({
      include: { factors: { orderBy: { priority: 'desc' } } },
      orderBy: { lineOfBusiness: 'asc' },
    });

    return NextResponse.json(tables);
  } catch (error) {
    console.error('Rate tables GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch rate tables' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const table = await prisma.rateTable.create({
      data: {
        lineOfBusiness: body.lineOfBusiness,
        baseRate: body.baseRate,
        effectiveDate: new Date(body.effectiveDate),
        expirationDate: body.expirationDate ? new Date(body.expirationDate) : null,
        description: body.description || null,
      },
    });

    return NextResponse.json(table, { status: 201 });
  } catch (error) {
    console.error('Rate tables POST error:', error);
    return NextResponse.json({ error: 'Failed to create rate table' }, { status: 500 });
  }
}
