import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createEscalation } from '@/lib/escalation-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const escalations = await prisma.escalation.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { slaDeadline: 'asc' }],
    });

    return NextResponse.json(escalations);
  } catch (error) {
    console.error('Escalations GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch escalations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const escalation = await createEscalation(body);

    return NextResponse.json(escalation, { status: 201 });
  } catch (error: any) {
    console.error('Escalations POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
