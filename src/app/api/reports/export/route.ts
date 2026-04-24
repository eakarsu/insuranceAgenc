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
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'claims';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (type !== 'claims') {
      return NextResponse.json({ error: 'Unsupported export type' }, { status: 400 });
    }

    // Build date range filter
    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        client: {
          select: { firstName: true, lastName: true },
        },
        policy: {
          select: { policyNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      // Generate CSV
      const headers = [
        'Claim Number',
        'Client',
        'Policy',
        'Type',
        'Status',
        'Date of Loss',
        'Estimated Loss',
        'Paid Amount',
        'AI Risk Score',
        'AI Classification',
      ];

      const rows = claims.map((claim) => {
        const clientName = claim.client
          ? `${claim.client.firstName} ${claim.client.lastName}`
          : '';
        const policyNumber = claim.policy?.policyNumber || '';
        const dateOfLoss = claim.dateOfLoss
          ? new Date(claim.dateOfLoss).toISOString().split('T')[0]
          : '';
        const estimatedLoss = claim.estimatedLoss ? Number(claim.estimatedLoss) : '';
        const paidAmount = claim.paidAmount ? Number(claim.paidAmount) : '';
        const aiRiskScore = claim.aiRiskScore != null ? claim.aiRiskScore : '';
        const aiClassification = claim.aiClassification || '';

        return [
          escapeCsvField(claim.claimNumber),
          escapeCsvField(clientName),
          escapeCsvField(policyNumber),
          escapeCsvField(claim.type),
          escapeCsvField(claim.status),
          escapeCsvField(dateOfLoss.toString()),
          escapeCsvField(estimatedLoss.toString()),
          escapeCsvField(paidAmount.toString()),
          escapeCsvField(aiRiskScore.toString()),
          escapeCsvField(aiClassification),
        ].join(',');
      });

      const csv = [headers.join(','), ...rows].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="claims-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default: JSON format
    const jsonData = claims.map((claim) => ({
      claimNumber: claim.claimNumber,
      client: claim.client
        ? `${claim.client.firstName} ${claim.client.lastName}`
        : null,
      policy: claim.policy?.policyNumber || null,
      type: claim.type,
      status: claim.status,
      dateOfLoss: claim.dateOfLoss,
      estimatedLoss: claim.estimatedLoss ? Number(claim.estimatedLoss) : null,
      paidAmount: claim.paidAmount ? Number(claim.paidAmount) : null,
      aiRiskScore: claim.aiRiskScore,
      aiClassification: claim.aiClassification,
    }));

    return NextResponse.json({ claims: jsonData });
  } catch (error) {
    console.error('Export GET error:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
