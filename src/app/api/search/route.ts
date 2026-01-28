import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const q = request.nextUrl.searchParams.get('q') || '';
    if (q.length < 2) return NextResponse.json([]);

    const [clients, policies, quotes, claims] = await Promise.all([
      prisma.client.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { businessName: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, businessName: true, type: true },
      }),
      prisma.policy.findMany({
        where: { policyNumber: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, policyNumber: true, lineOfBusiness: true },
      }),
      prisma.quote.findMany({
        where: { quoteNumber: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, quoteNumber: true, lineOfBusiness: true },
      }),
      prisma.claim.findMany({
        where: { claimNumber: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, claimNumber: true, type: true },
      }),
    ]);

    const results = [
      ...clients.map((c) => ({
        id: c.id,
        type: 'client',
        title: c.type === 'COMMERCIAL' && c.businessName ? c.businessName : `${c.firstName} ${c.lastName}`,
        subtitle: 'Client',
        path: `/clients/${c.id}`,
      })),
      ...policies.map((p) => ({
        id: p.id,
        type: 'policy',
        title: p.policyNumber,
        subtitle: p.lineOfBusiness.replace(/_/g, ' '),
        path: `/policies/${p.id}`,
      })),
      ...quotes.map((q) => ({
        id: q.id,
        type: 'quote',
        title: q.quoteNumber,
        subtitle: q.lineOfBusiness.replace(/_/g, ' '),
        path: `/quotes/${q.id}`,
      })),
      ...claims.map((c) => ({
        id: c.id,
        type: 'claim',
        title: c.claimNumber,
        subtitle: c.type,
        path: `/claims/${c.id}`,
      })),
    ];

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
