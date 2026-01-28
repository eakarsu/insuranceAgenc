import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const splits = await prisma.commissionSplit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        commission: {
          include: {
            policy: {
              select: {
                policyNumber: true,
                client: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ splits });
  } catch (error) {
    console.error('Commission splits GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch commission splits' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const split = await prisma.commissionSplit.create({
      data: {
        commissionId: body.commissionId,
        producerId: body.producerId,
        percentage: body.percentage,
        amount: body.amount,
      },
      include: {
        commission: {
          include: {
            policy: {
              select: {
                policyNumber: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(split, { status: 201 });
  } catch (error) {
    console.error('Commission splits POST error:', error);
    return NextResponse.json({ error: 'Failed to create commission split' }, { status: 500 });
  }
}
