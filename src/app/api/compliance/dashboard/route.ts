/**
 * GET /api/compliance/dashboard
 *
 * Returns a comprehensive compliance dashboard with:
 *   - SLA compliance rate (escalations resolved on time)
 *   - Overdue compliance checks
 *   - Upcoming policy renewals (next 60 days)
 *   - Regulatory deadlines (compliance rules with upcoming due dates)
 *   - AI health summary (OpenRouter model status)
 *   - Compliance score by severity / category
 *   - Complaint SLA adherence
 *   - Open escalations summary
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

// ── AI health summary ────────────────────────────────────────────────────────

async function generateAIHealthSummary(data: {
  complianceScore: number;
  overdueCount: number;
  openEscalations: number;
  criticalViolations: number;
  slaComplianceRate: number;
  upcomingRenewals: number;
  openComplaints: number;
  pastSlaComplaints: number;
}): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    return buildFallbackSummary(data);
  }

  const systemPrompt = `You are an insurance compliance officer AI assistant. You receive compliance metrics and write a concise executive health summary (3-4 sentences) for agency leadership. Be direct, professional, and highlight the most urgent items. Use plain language without markdown.`;

  const userPrompt = `Generate an executive compliance health summary for these metrics:
- Overall compliance score: ${data.complianceScore}%
- Overdue compliance checks: ${data.overdueCount}
- Open escalations: ${data.openEscalations}
- Critical rule violations: ${data.criticalViolations}
- SLA compliance rate (escalations resolved on time): ${data.slaComplianceRate}%
- Upcoming policy renewals (next 60 days): ${data.upcomingRenewals}
- Open complaints: ${data.openComplaints}
- Complaints past SLA deadline: ${data.pastSlaComplaints}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) return buildFallbackSummary(data);

    const aiData = await response.json();
    const text = aiData.choices?.[0]?.message?.content;
    return text || buildFallbackSummary(data);
  } catch {
    return buildFallbackSummary(data);
  }
}

function buildFallbackSummary(data: {
  complianceScore: number;
  overdueCount: number;
  openEscalations: number;
  criticalViolations: number;
  slaComplianceRate: number;
  upcomingRenewals: number;
}): string {
  const status =
    data.complianceScore >= 90
      ? 'in good standing'
      : data.complianceScore >= 75
      ? 'requires attention'
      : 'in a critical state requiring immediate action';

  const urgentNote =
    data.criticalViolations > 0
      ? ` There are ${data.criticalViolations} critical rule violations that require immediate remediation.`
      : '';

  const escalationNote =
    data.openEscalations > 5
      ? ` ${data.openEscalations} escalations are currently open.`
      : '';

  return (
    `Agency compliance is ${status} with an overall score of ${data.complianceScore}%.` +
    ` SLA adherence is at ${data.slaComplianceRate}% and ${data.overdueCount} compliance checks are overdue.` +
    urgentNote +
    escalationNote +
    (data.upcomingRenewals > 0
      ? ` ${data.upcomingRenewals} policies are due for renewal in the next 60 days.`
      : '')
  );
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    // ── Parallel data fetch ────────────────────────────────────────────────
    const [
      // Compliance checks
      totalChecks,
      compliantCount,
      nonCompliantCount,
      pendingCount,
      waivedCount,

      // Overdue checks (nextDueDate is in the past, not yet compliant)
      overdueChecks,

      // Upcoming due dates (next 30 days)
      upcomingDueDates,

      // All checks with rule details (for breakdown)
      allChecks,

      // Active rules
      totalRules,
      allRules,

      // Escalations
      openEscalations,
      allResolvedEscalations,
      overdueEscalations,

      // Policies — upcoming renewals
      upcomingRenewals,

      // Complaints
      openComplaints,
      overdueComplaints,
      totalResolvedComplaints,
      onTimeResolvedComplaints,

      // Regulatory deadlines — active rules with dueDate in next 60 days
      regulatoryDeadlines,
    ] = await Promise.all([
      // Compliance check counts
      prisma.complianceCheck.count(),
      prisma.complianceCheck.count({ where: { status: 'COMPLIANT' } }),
      prisma.complianceCheck.count({ where: { status: 'NON_COMPLIANT' } }),
      prisma.complianceCheck.count({ where: { status: 'PENDING' } }),
      prisma.complianceCheck.count({ where: { status: 'WAIVED' } }),

      // Overdue: nextDueDate is past, status is not COMPLIANT or WAIVED
      prisma.complianceCheck.findMany({
        where: {
          nextDueDate: { lt: now },
          status: { notIn: ['COMPLIANT', 'WAIVED'] },
        },
        include: {
          rule: { select: { name: true, category: true, severity: true, requirement: true } },
        },
        orderBy: { nextDueDate: 'asc' },
        take: 50,
      }),

      // Upcoming due dates (next 30 days)
      prisma.complianceCheck.findMany({
        where: {
          nextDueDate: { gte: now, lte: thirtyDaysFromNow },
        },
        include: { rule: { select: { name: true, category: true, severity: true } } },
        orderBy: { nextDueDate: 'asc' },
        take: 20,
      }),

      // All checks for category/severity breakdown
      prisma.complianceCheck.findMany({
        include: { rule: { select: { category: true, severity: true } } },
      }),

      // Active rules count
      prisma.complianceRule.count({ where: { isActive: true } }),

      // All active rules for breakdown
      prisma.complianceRule.findMany({
        where: { isActive: true },
        select: { category: true, severity: true },
      }),

      // Open escalations
      prisma.escalation.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),

      // Resolved escalations (for SLA calculation)
      prisma.escalation.findMany({
        where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { not: null } },
        select: { slaDeadline: true, resolvedAt: true },
      }),

      // Overdue open escalations (slaDeadline passed, still open)
      prisma.escalation.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          slaDeadline: { lt: now },
        },
      }),

      // Upcoming policy renewals (next 60 days)
      prisma.policy.findMany({
        where: {
          status: 'ACTIVE',
          expirationDate: { gte: now, lte: sixtyDaysFromNow },
        },
        select: {
          id: true,
          policyNumber: true,
          lineOfBusiness: true,
          expirationDate: true,
          premium: true,
          client: { select: { firstName: true, lastName: true, businessName: true, type: true } },
          carrier: { select: { name: true } },
        },
        orderBy: { expirationDate: 'asc' },
        take: 50,
      }),

      // Open complaints
      prisma.complaint.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } }),

      // Complaints past SLA
      prisma.complaint.count({
        where: {
          status: { in: ['OPEN', 'INVESTIGATING'] },
          slaDeadline: { lt: now },
        },
      }),

      // All resolved complaints count
      prisma.complaint.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),

      // On-time resolved complaints
      prisma.complaint.count({
        where: {
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { not: null },
          // resolvedAt <= slaDeadline (Prisma doesn't support field comparison natively)
          // We'll compute this from raw counts below
        },
      }),

      // Regulatory deadlines — active rules with dueDate in next 60 days
      prisma.complianceRule.findMany({
        where: {
          isActive: true,
          dueDate: { gte: now, lte: sixtyDaysFromNow },
        },
        select: {
          id: true,
          name: true,
          category: true,
          severity: true,
          requirement: true,
          dueDate: true,
          state: true,
          lineOfBusiness: true,
        },
        orderBy: { dueDate: 'asc' },
        take: 30,
      }),
    ]);

    // ── SLA compliance rate (escalations) ──────────────────────────────────
    let slaComplianceRate = 100;
    if (allResolvedEscalations.length > 0) {
      const onTime = allResolvedEscalations.filter(
        (e) => e.resolvedAt && e.resolvedAt <= e.slaDeadline
      ).length;
      slaComplianceRate = Math.round((onTime / allResolvedEscalations.length) * 100);
    }

    // ── Compliance score ───────────────────────────────────────────────────
    const totalEvaluated = compliantCount + nonCompliantCount + pendingCount + waivedCount;
    const complianceScore =
      totalEvaluated > 0
        ? Math.round(((compliantCount + waivedCount) / totalEvaluated) * 100)
        : 100;

    // ── Critical violations ────────────────────────────────────────────────
    const criticalViolations = allChecks.filter(
      (c) => c.status === 'NON_COMPLIANT' && c.rule?.severity === 'CRITICAL'
    ).length;

    // ── Breakdown by severity ──────────────────────────────────────────────
    const bySeverity: Record<
      string,
      { total: number; compliant: number; nonCompliant: number; complianceRate: number }
    > = {};
    for (const check of allChecks) {
      const sev = check.rule?.severity || 'MEDIUM';
      if (!bySeverity[sev]) bySeverity[sev] = { total: 0, compliant: 0, nonCompliant: 0, complianceRate: 0 };
      bySeverity[sev].total++;
      if (check.status === 'COMPLIANT' || check.status === 'WAIVED') bySeverity[sev].compliant++;
      if (check.status === 'NON_COMPLIANT') bySeverity[sev].nonCompliant++;
    }
    for (const sev of Object.keys(bySeverity)) {
      const b = bySeverity[sev];
      b.complianceRate = b.total > 0 ? Math.round((b.compliant / b.total) * 100) : 100;
    }

    // ── Breakdown by category ──────────────────────────────────────────────
    const byCategory: Record<
      string,
      { total: number; compliant: number; nonCompliant: number; complianceRate: number }
    > = {};
    for (const check of allChecks) {
      const cat = check.rule?.category || 'OTHER';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, compliant: 0, nonCompliant: 0, complianceRate: 0 };
      byCategory[cat].total++;
      if (check.status === 'COMPLIANT' || check.status === 'WAIVED') byCategory[cat].compliant++;
      if (check.status === 'NON_COMPLIANT') byCategory[cat].nonCompliant++;
    }
    for (const cat of Object.keys(byCategory)) {
      const b = byCategory[cat];
      b.complianceRate = b.total > 0 ? Math.round((b.compliant / b.total) * 100) : 100;
    }

    // ── Non-compliant items ────────────────────────────────────────────────
    const nonCompliantItems = allChecks
      .filter((c) => c.status === 'NON_COMPLIANT')
      .map((c) => ({
        id: c.id,
        ruleId: c.ruleId,
        category: c.rule?.category || 'Unknown',
        severity: c.rule?.severity || 'MEDIUM',
        checkedAt: c.checkedAt,
        nextDueDate: c.nextDueDate,
      }));

    // ── Shape overdue checks ───────────────────────────────────────────────
    const overdueItems = overdueChecks.map((c) => ({
      id: c.id,
      ruleId: c.ruleId,
      ruleName: c.rule?.name || 'Unknown',
      category: c.rule?.category || 'OTHER',
      severity: c.rule?.severity || 'MEDIUM',
      requirement: c.rule?.requirement || '',
      status: c.status,
      nextDueDate: c.nextDueDate,
      daysOverdue: c.nextDueDate
        ? Math.floor((now.getTime() - new Date(c.nextDueDate).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    }));

    // ── Shape upcoming renewals ────────────────────────────────────────────
    const renewals = upcomingRenewals.map((p) => ({
      id: p.id,
      policyNumber: p.policyNumber,
      lineOfBusiness: p.lineOfBusiness,
      expirationDate: p.expirationDate,
      daysUntilExpiry: Math.ceil(
        (new Date(p.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      premium: Number(p.premium),
      carrier: p.carrier?.name ?? 'N/A',
      clientName:
        p.client?.type === 'COMMERCIAL'
          ? p.client?.businessName ?? `${p.client?.firstName} ${p.client?.lastName}`
          : `${p.client?.firstName} ${p.client?.lastName}`,
    }));

    // ── AI health summary ──────────────────────────────────────────────────
    const aiSummaryData = {
      complianceScore,
      overdueCount: overdueChecks.length,
      openEscalations,
      criticalViolations,
      slaComplianceRate,
      upcomingRenewals: upcomingRenewals.length,
      openComplaints,
      pastSlaComplaints: overdueComplaints,
    };

    const aiHealthSummary = await generateAIHealthSummary(aiSummaryData);

    // ── AI integration status ──────────────────────────────────────────────
    const aiStatus = {
      openrouterConfigured: Boolean(OPENROUTER_API_KEY),
      anthropicConfigured: Boolean(process.env.ANTHROPIC_API_KEY),
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
      currentModel: OPENROUTER_MODEL,
      summaryGenerated: Boolean(OPENROUTER_API_KEY),
    };

    // ── Final response ─────────────────────────────────────────────────────
    return NextResponse.json({
      // Core metrics
      complianceScore,
      totalRules,
      totalChecks,
      compliantCount,
      nonCompliantCount,
      pendingCount,
      waivedCount,

      // SLA
      slaComplianceRate,
      overdueEscalations,
      openEscalations,
      totalResolvedEscalations: allResolvedEscalations.length,

      // Compliance health
      criticalViolations,
      overdueItems,
      overdueCount: overdueChecks.length,
      nonCompliantItems,

      // Upcoming
      upcomingDueDates,
      upcomingRenewals: renewals,
      upcomingRenewalsCount: renewals.length,

      // Regulatory deadlines
      regulatoryDeadlines: regulatoryDeadlines.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        severity: r.severity,
        requirement: r.requirement,
        dueDate: r.dueDate,
        daysUntilDue: r.dueDate
          ? Math.ceil(
              (new Date(r.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            )
          : null,
        state: r.state,
        lineOfBusiness: r.lineOfBusiness,
      })),

      // Complaints
      openComplaints,
      overdueComplaints,
      totalResolvedComplaints,
      complaintSlaRate:
        totalResolvedComplaints > 0
          ? Math.round(((totalResolvedComplaints - overdueComplaints) / totalResolvedComplaints) * 100)
          : 100,

      // Breakdowns
      bySeverity,
      byCategory,

      // AI
      aiHealthSummary,
      aiStatus,

      // Metadata
      generatedAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('[compliance/dashboard] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance dashboard' },
      { status: 500 }
    );
  }
}
