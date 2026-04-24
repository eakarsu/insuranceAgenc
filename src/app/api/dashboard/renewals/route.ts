import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const renewals = await prisma.policy.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          gte: now,
          lte: sixtyDaysFromNow,
        },
      },
      take: 20,
      orderBy: { expirationDate: 'asc' },
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        carrier: {
          select: { name: true },
        },
      },
    });

    // Enrich with renewal predictions and quotes
    const enriched = await Promise.all(
      renewals.map(async (policy) => {
        const [prediction, renewalQuote] = await Promise.all([
          prisma.renewalPrediction.findFirst({
            where: { policyId: policy.id },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.quote.findFirst({
            where: { renewalPolicyId: policy.id, isRenewal: true },
            orderBy: { createdAt: 'desc' },
          }),
        ]);

        return {
          ...policy,
          retentionScore: prediction ? Number(prediction.retentionScore) : null,
          renewalQuoteId: renewalQuote?.id || null,
          renewalQuoteStatus: renewalQuote?.status || null,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Renewals error:', error);
    return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 });
  }
}
