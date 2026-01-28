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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const lineOfBusiness = searchParams.get('lineOfBusiness') || '';
    const carrierId = searchParams.get('carrierId') || '';

    const where: any = {};

    if (search) {
      where.OR = [
        { policyNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { client: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status) where.status = status;
    if (lineOfBusiness) where.lineOfBusiness = lineOfBusiness;
    if (carrierId) where.carrierId = carrierId;

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, businessName: true, type: true } },
          carrier: { select: { id: true, name: true } },
          agent: { select: { id: true, name: true } },
        },
      }),
      prisma.policy.count({ where }),
    ]);

    return NextResponse.json({
      policies,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Policies GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Generate policy number
    const count = await prisma.policy.count();
    const policyNumber = `POL-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Clean and prepare data
    const cleanData = {
      policyNumber,
      clientId: body.clientId,
      carrierId: body.carrierId,
      lineOfBusiness: body.lineOfBusiness,
      type: body.lineOfBusiness?.includes('COMMERCIAL') ? 'COMMERCIAL' : 'PERSONAL',
      status: body.status || 'ACTIVE',
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      expirationDate: body.expirationDate ? new Date(body.expirationDate) : new Date(),
      premium: body.premium ? parseFloat(body.premium) : 0,
      billingMethod: body.billingMethod || 'AGENCY_BILL',
      agentId: session.user.id,
    };

    const policy = await prisma.policy.create({
      data: cleanData,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        carrier: { select: { id: true, name: true } },
      },
    });

    await prisma.activity.create({
      data: {
        type: 'POLICY_CREATED',
        title: 'Policy created',
        description: `Created policy ${policyNumber}`,
        userId: session.user.id,
        clientId: policy.clientId,
        policyId: policy.id,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('Policies POST error:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}
