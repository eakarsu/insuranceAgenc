import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const policyId = searchParams.get('policyId');
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: any = {};
    if (policyId) where.policyId = policyId;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const schedules = await prisma.paymentSchedule.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        policy: { select: { policyNumber: true, lineOfBusiness: true } },
      },
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('PaymentSchedules GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payment schedules' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const schedule = await prisma.paymentSchedule.create({
      data: {
        policyId: body.policyId,
        clientId: body.clientId,
        amount: body.amount,
        dueDate: new Date(body.dueDate),
        status: body.status || 'SCHEDULED',
      },
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('PaymentSchedules POST error:', error);
    return NextResponse.json({ error: 'Failed to create payment schedule' }, { status: 500 });
  }
}
