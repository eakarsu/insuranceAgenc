import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyzeClaim } from '@/lib/ai-claims-service';
import { invalidateCache } from '@/lib/cache';

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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const count = await prisma.claim.count();
    const claimNumber = `CLM-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Clean and prepare data
    const cleanData = {
      claimNumber,
      clientId: body.clientId,
      policyId: body.policyId,
      type: body.type,
      status: 'REPORTED' as const,
      dateOfLoss: body.dateOfLoss ? new Date(body.dateOfLoss) : new Date(),
      description: body.description || 'No description provided',
      lossLocation: body.lossLocation || null,
      estimatedLoss: body.estimatedLoss ? parseFloat(body.estimatedLoss) : null,
      agentId: session.user.id,
    };

    const claim = await prisma.claim.create({
      data: cleanData,
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    });

    await prisma.activity.create({
      data: {
        type: 'CLAIM_REPORTED',
        title: 'Claim reported',
        description: `Reported claim ${claimNumber}`,
        userId: session.user.id,
        clientId: claim.clientId,
        claimId: claim.id,
      },
    });

    // Invalidate report caches
    invalidateCache('report:*').catch(() => {});

    // Fire-and-forget AI analysis to auto-populate AI fields
    analyzeClaim({
      type: cleanData.type,
      description: cleanData.description,
      estimatedLoss: cleanData.estimatedLoss,
      dateOfLoss: cleanData.dateOfLoss.toISOString(),
      lossLocation: cleanData.lossLocation,
      claimNumber: cleanData.claimNumber,
      status: 'REPORTED',
    }).then(async (analysis) => {
      try {
        await prisma.claim.update({
          where: { id: claim.id },
          data: {
            aiClassification: analysis.classification,
            aiRiskScore: analysis.riskScore,
            aiFlags: {
              flags: analysis.flags,
              recommendations: analysis.recommendations,
              summary: analysis.summary,
              analyzedAt: new Date().toISOString(),
            },
          },
        });
      } catch (e) {
        console.error('Auto AI analysis update failed:', e);
      }
    }).catch((e) => console.error('Auto AI analysis failed:', e));

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error('Claims POST error:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}
