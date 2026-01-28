import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const households = await prisma.household.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { members: true } } },
    });

    return NextResponse.json(households);
  } catch (error) {
    console.error('Households GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch households' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const household = await prisma.household.create({ data: body });

    return NextResponse.json(household, { status: 201 });
  } catch (error) {
    console.error('Households POST error:', error);
    return NextResponse.json({ error: 'Failed to create household' }, { status: 500 });
  }
}
