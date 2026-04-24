import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { calculatePremium } from '@/lib/rating-engine';

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

    const where: any = {};
    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
        { client: { businessName: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status) where.status = status;
    if (lineOfBusiness) where.lineOfBusiness = lineOfBusiness;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
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
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({ quotes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error('Quotes GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const count = await prisma.quote.count();
    const quoteNumber = `QT-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`;

    // Auto-calculate premium via rating engine if risk info provided
    let premiumData: { premium?: number; fees?: number; taxes?: number; totalPremium?: number } = {};
    if (body.riskInfo && body.lineOfBusiness) {
      try {
        const rating = await calculatePremium({
          lineOfBusiness: body.lineOfBusiness,
          riskInfo: typeof body.riskInfo === 'string' ? { notes: body.riskInfo } : body.riskInfo,
          clientInfo: body.clientInfo,
          coverageOptions: body.coverageOptions,
        });
        if (rating.totalPremium > 0) {
          premiumData = {
            premium: rating.subtotal,
            fees: rating.fees,
            taxes: rating.taxes,
            totalPremium: rating.totalPremium,
          };
        }
      } catch (err) {
        console.warn('Rating engine error (non-fatal):', err);
      }
    }

    // Clean and prepare data
    const cleanData = {
      quoteNumber,
      clientId: body.clientId,
      lineOfBusiness: body.lineOfBusiness,
      type: body.lineOfBusiness?.replace(/_/g, ' ') || 'Quote',
      status: 'DRAFT' as const,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : new Date(),
      riskInfo: body.riskInfo ? (typeof body.riskInfo === 'string' ? { notes: body.riskInfo } : body.riskInfo) : null,
      agentId: session.user.id,
      ...premiumData,
    };

    const quote = await prisma.quote.create({
      data: cleanData as any,
      include: { client: { select: { id: true, firstName: true, lastName: true } } },
    });

    await prisma.activity.create({
      data: {
        type: 'QUOTE_CREATED',
        title: 'Quote created',
        description: `Created quote ${quoteNumber}`,
        userId: session.user.id,
        clientId: quote.clientId,
        quoteId: quote.id,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Quotes POST error:', error);
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
  }
}
