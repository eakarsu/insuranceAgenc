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
    const type = searchParams.get('type') || '';
    const status = searchParams.get('status') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const noHousehold = searchParams.get('noHousehold') === 'true';

    const where: any = {};

    // Filter clients without a household
    if (noHousehold) {
      where.householdId = null;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { businessName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          agent: { select: { id: true, name: true } },
          household: { select: { id: true, name: true } },
          _count: {
            select: { policies: true, quotes: true, claims: true },
          },
        },
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Clients GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Use provided agentId if specified (for managers/admins), otherwise use session user
    const agentId = body.agentId || session.user.id;

    // Clean up empty strings to null for optional fields
    const cleanData = {
      type: body.type,
      status: body.status || 'PROSPECT',
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      mobile: body.mobile || null,
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      ssn: body.ssn || null,
      businessName: body.businessName || null,
      businessType: body.businessType || null,
      ein: body.ein || null,
      yearsInBusiness: body.yearsInBusiness || null,
      numberOfEmployees: body.numberOfEmployees || null,
      annualRevenue: body.annualRevenue || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zipCode: body.zipCode || null,
      source: body.source || null,
      referredBy: body.referredBy || null,
      notes: body.notes || null,
      tags: body.tags || [],
      householdId: body.householdId || null,
      agentId,
    };

    const client = await prisma.client.create({
      data: cleanData,
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    // Create activity
    await prisma.activity.create({
      data: {
        type: 'CLIENT_CREATED',
        title: 'New client created',
        description: `Created new client ${client.firstName} ${client.lastName}`,
        userId: session.user.id,
        clientId: client.id,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error('Clients POST error:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
