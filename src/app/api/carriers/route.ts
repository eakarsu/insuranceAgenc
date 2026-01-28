import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const carriers = await prisma.carrier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(carriers);
  } catch (error) {
    console.error('Carriers GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch carriers' }, { status: 500 });
  }
}
