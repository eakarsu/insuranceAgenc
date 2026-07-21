import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { invalidateCache } from '@/lib/cache';
import { getClaimActor } from '@/lib/claims-auth';
import { ClaimGovernanceError } from '@/lib/claims-governance-rules';
import { intakeClaim } from '@/lib/claims-governance';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    const type = searchParams.get('type') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { client: { businessName: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
        { lossLocation: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (type) where.type = type;

    const [claims, total] = await Promise.all([
      prisma.claim.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, businessName: true } },
          policy: { select: { id: true, policyNumber: true, lineOfBusiness: true } },
          agent: { select: { id: true, name: true } },
        },
      }),
      prisma.claim.count({ where }),
    ]);

    return NextResponse.json({ claims, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Claims GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await getClaimActor();
    const body = await request.json();
    const externalEventId = request.headers.get('idempotency-key') || body.externalEventId;
    const result = await intakeClaim({ ...body, externalEventId }, actor);
    invalidateCache('report:*').catch(() => {});
    return NextResponse.json({ ...result.claim, idempotent: result.idempotent }, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    console.error('Claims POST error:', error);
    if (error instanceof ClaimGovernanceError) {
      return NextResponse.json({ error: error.message, code: error.code, details: error.details }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}
