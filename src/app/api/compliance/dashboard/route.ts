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

    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [
      totalRules,
      totalChecks,
      compliantCount,
      nonCompliantCount,
      pendingCount,
      waivedCount,
      upcomingDueDates,
      allChecks,
      allRules,
    ] = await Promise.all([
      prisma.complianceRule.count({ where: { isActive: true } }),
      prisma.complianceCheck.count(),
      prisma.complianceCheck.count({ where: { status: 'COMPLIANT' } }),
      prisma.complianceCheck.count({ where: { status: 'NON_COMPLIANT' } }),
      prisma.complianceCheck.count({ where: { status: 'PENDING' } }),
      prisma.complianceCheck.count({ where: { status: 'WAIVED' } }),
      prisma.complianceCheck.findMany({
        where: {
          nextDueDate: {
            gte: new Date(),
            lte: thirtyDaysFromNow,
          },
        },
        include: { rule: { select: { name: true, category: true, severity: true } } },
        orderBy: { nextDueDate: 'asc' },
        take: 20,
      }),
      prisma.complianceCheck.findMany({
        include: { rule: { select: { category: true, severity: true } } },
      }),
      prisma.complianceRule.findMany({
        where: { isActive: true },
        select: { category: true, severity: true },
      }),
    ]);

    // Calculate compliance score
    const totalEvaluated = compliantCount + nonCompliantCount + pendingCount + waivedCount;
    const complianceScore = totalEvaluated > 0
      ? Math.round(((compliantCount + waivedCount) / totalEvaluated) * 100)
      : 100;

    // Breakdown by severity
    const bySeverity: Record<string, { total: number; compliant: number; nonCompliant: number }> = {};
    for (const check of allChecks) {
      const sev = check.rule?.severity || 'MEDIUM';
      if (!bySeverity[sev]) bySeverity[sev] = { total: 0, compliant: 0, nonCompliant: 0 };
      bySeverity[sev].total++;
      if (check.status === 'COMPLIANT' || check.status === 'WAIVED') bySeverity[sev].compliant++;
      if (check.status === 'NON_COMPLIANT') bySeverity[sev].nonCompliant++;
    }

    // Breakdown by category
    const byCategory: Record<string, { total: number; compliant: number; nonCompliant: number }> = {};
    for (const check of allChecks) {
      const cat = check.rule?.category || 'OTHER';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, compliant: 0, nonCompliant: 0 };
      byCategory[cat].total++;
      if (check.status === 'COMPLIANT' || check.status === 'WAIVED') byCategory[cat].compliant++;
      if (check.status === 'NON_COMPLIANT') byCategory[cat].nonCompliant++;
    }

    // Non-compliant items
    const nonCompliantItems = allChecks
      .filter((c) => c.status === 'NON_COMPLIANT')
      .map((c) => ({
        id: c.id,
        ruleId: c.ruleId,
        ruleName: c.rule?.category || 'Unknown',
        severity: c.rule?.severity || 'MEDIUM',
        checkedAt: c.checkedAt,
      }));

    return NextResponse.json({
      totalRules,
      totalChecks,
      compliantCount,
      nonCompliantCount,
      pendingCount,
      waivedCount,
      complianceScore,
      upcomingDueDates,
      bySeverity,
      byCategory,
      nonCompliantItems,
    });
  } catch (error) {
    console.error('ComplianceDashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch compliance dashboard' }, { status: 500 });
  }
}
