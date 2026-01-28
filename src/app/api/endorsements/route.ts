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

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { endorsementNumber: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { policy: { policyNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const endorsements = await prisma.endorsement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json({ endorsements });
  } catch (error) {
    console.error('Endorsements GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch endorsements' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Generate endorsement number
    const timestamp = Date.now();
    const endorsementNumber = `END-${timestamp}`;

    const endorsement = await prisma.endorsement.create({
      data: {
        policyId: body.policyId,
        endorsementNumber,
        type: body.type,
        description: body.description,
        effectiveDate: new Date(body.effectiveDate),
        premiumChange: body.premiumChange ? parseFloat(body.premiumChange) : null,
        status: body.status || 'PENDING',
      },
      include: {
        policy: {
          select: {
            id: true,
            policyNumber: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });

    return NextResponse.json(endorsement, { status: 201 });
  } catch (error) {
    console.error('Endorsements POST error:', error);
    return NextResponse.json({ error: 'Failed to create endorsement' }, { status: 500 });
  }
}
