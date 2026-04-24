import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const JWT_SECRET = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');

/**
 * GDPR: Export all customer data as JSON.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const clientId = payload.clientId as string;

    const [client, policies, claims, payments, quotes, documents, activities] = await Promise.all([
      prisma.client.findUnique({
        where: { id: clientId },
        select: {
          firstName: true, lastName: true, email: true, phone: true, mobile: true,
          dateOfBirth: true, address: true, city: true, state: true, zipCode: true,
          type: true, status: true, businessName: true, createdAt: true,
        },
      }),
      prisma.policy.findMany({
        where: { clientId },
        select: { policyNumber: true, lineOfBusiness: true, status: true, effectiveDate: true, expirationDate: true, premium: true },
      }),
      prisma.claim.findMany({
        where: { clientId },
        select: { claimNumber: true, type: true, status: true, dateOfLoss: true, estimatedLoss: true },
      }),
      prisma.payment.findMany({
        where: { clientId },
        select: { amount: true, status: true, paidAt: true, description: true },
      }),
      prisma.quote.findMany({
        where: { clientId },
        select: { quoteNumber: true, lineOfBusiness: true, status: true, totalPremium: true },
      }),
      prisma.document.findMany({
        where: { clientId },
        select: { name: true, type: true, fileName: true, uploadedAt: true },
      }),
      prisma.activity.findMany({
        where: { clientId },
        select: { type: true, title: true, description: true, createdAt: true },
        take: 100,
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      personalData: client,
      policies,
      claims,
      payments,
      quotes,
      documents,
      recentActivity: activities,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-export-${clientId}-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
