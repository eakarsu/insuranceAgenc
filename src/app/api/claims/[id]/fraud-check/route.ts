/**
 * POST /api/claims/:id/fraud-check
 *
 * Runs a comprehensive AI fraud detection analysis on a claim.
 * Fetches the claim and full client history, calls the fraud detection
 * AI with structured prompting, and persists the result to the
 * claims_fraud_assessments table (ClaimFraudAssessment model).
 *
 * If the fraud risk score exceeds 50 (ELEVATED or above), an escalation
 * is automatically created in the escalation queue.
 *
 * Response:
 * {
 *   fraud_risk_score: number (0-100),
 *   fraud_risk_level: "LOW" | "MODERATE" | "ELEVATED" | "HIGH" | "CRITICAL",
 *   risk_factors: Array<{ factor: string; severity: "LOW" | "MEDIUM" | "HIGH"; description: string }>,
 *   recommended_action: "APPROVE_NORMAL" | "ENHANCED_REVIEW" | "SIU_REFERRAL" | "CLAIM_HOLD",
 *   explanation: string,
 *   assessment_id: string,
 *   triggered_escalation: boolean
 * }
 *
 * GET /api/claims/:id/fraud-check
 *
 * Returns all previous fraud assessments for the claim, newest first.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { detectFraud } from '@/lib/ai-claims-service';

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreToLevel(score: number): string {
  if (score < 20) return 'LOW';
  if (score < 40) return 'MODERATE';
  if (score < 60) return 'ELEVATED';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
}

function scoreToAction(score: number): string {
  if (score < 20) return 'APPROVE_NORMAL';
  if (score < 40) return 'ENHANCED_REVIEW';
  if (score < 70) return 'SIU_REFERRAL';
  return 'CLAIM_HOLD';
}

// ── GET — list previous assessments ─────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const claim = await prisma.claim.findUnique({
      where: { id },
      select: { id: true, claimNumber: true },
    });
    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

    const assessments = await prisma.claimFraudAssessment.findMany({
      where: { claimId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      claimId: id,
      claimNumber: claim.claimNumber,
      assessments,
      total: assessments.length,
    });
  } catch (error: any) {
    console.error('[fraud-check GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch fraud assessments' }, { status: 500 });
  }
}

// ── POST — run new fraud assessment ─────────────────────────────────────────

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // ── 1. Fetch claim with full context ──────────────────────────────────
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            businessName: true,
            type: true,
            createdAt: true,
            state: true,
            city: true,
          },
        },
        policy: {
          select: {
            policyNumber: true,
            lineOfBusiness: true,
            premium: true,
            effectiveDate: true,
            expirationDate: true,
            status: true,
          },
        },
      },
    });

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

    // ── 2. Fetch client claims history ────────────────────────────────────
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const [totalClaims, recentClaims, priorSettledClaims] = await Promise.all([
      prisma.claim.count({ where: { clientId: claim.clientId } }),
      prisma.claim.count({
        where: { clientId: claim.clientId, dateReported: { gte: oneYearAgo } },
      }),
      prisma.claim.count({
        where: { clientId: claim.clientId, status: 'SETTLED' },
      }),
    ]);

    // ── 3. Call AI fraud detection ────────────────────────────────────────
    const fraudResult = await detectFraud({
      type: claim.type,
      description: claim.description,
      estimatedLoss: claim.estimatedLoss ? Number(claim.estimatedLoss) : null,
      dateOfLoss: claim.dateOfLoss.toISOString(),
      dateReported: claim.dateReported.toISOString(),
      lossLocation: claim.lossLocation,
      claimNumber: claim.claimNumber,
      clientHistory: { totalClaims, recentClaims },
    });

    // Convert 0-1 score to 0-100 integer
    const fraudRiskScore = Math.round(fraudResult.fraudRiskScore * 100);
    const fraudRiskLevel = scoreToLevel(fraudRiskScore);
    const recommendedAction = scoreToAction(fraudRiskScore);

    // Normalise risk factors from AI response
    const riskFactors = Array.isArray(fraudResult.indicators)
      ? fraudResult.indicators.map((ind: any) => ({
          factor: ind.type ?? 'Unknown',
          severity: ind.severity ?? 'MEDIUM',
          description: ind.description ?? '',
        }))
      : [];

    // ── 4. Determine if auto-escalation is needed ─────────────────────────
    let triggeredEscalation = false;
    let escalationId: string | undefined;

    if (fraudRiskScore >= 50) {
      try {
        const { createEscalation } = await import('@/lib/escalation-service');
        const escalation = await createEscalation({
          type: 'CLAIM',
          priority: fraudRiskScore >= 70 ? 'CRITICAL' : 'HIGH',
          title: `Fraud Alert: ${claim.claimNumber} — ${fraudRiskLevel} Risk (${fraudRiskScore}/100)`,
          description:
            `AI fraud assessment scored this claim at ${fraudRiskScore}/100 (${fraudRiskLevel}). ` +
            `Recommended action: ${recommendedAction}. ` +
            `Top factors: ${riskFactors
              .filter((f: any) => f.severity === 'HIGH')
              .map((f: any) => f.factor)
              .join(', ') || 'See full assessment'}. ` +
            `Client has ${totalClaims} total claims (${recentClaims} in last 12 months).`,
          entityType: 'CLAIM',
          entityId: id,
        });
        triggeredEscalation = true;
        escalationId = escalation?.id;
      } catch (e) {
        console.warn('[fraud-check] Failed to create escalation:', e);
      }
    }

    // ── 5. Persist assessment ─────────────────────────────────────────────
    const assessment = await prisma.claimFraudAssessment.create({
      data: {
        claimId: id,
        fraudRiskScore,
        fraudRiskLevel,
        riskFactors,
        explanation: fraudResult.explanation,
        recommendedAction,
        modelUsed: process.env.OPENROUTER_MODEL ?? 'anthropic/claude-3-haiku',
        triggeredEscalation,
        escalationId: escalationId ?? null,
        assessedBy: session.user.id,
      },
    });

    // ── 6. Update claim's aiRiskScore if higher than existing ─────────────
    const normalizedScore = fraudRiskScore / 100;
    if (!claim.aiRiskScore || normalizedScore > (claim.aiRiskScore as number)) {
      await prisma.claim.update({
        where: { id },
        data: {
          aiRiskScore: normalizedScore,
          aiClassification: fraudRiskLevel,
          aiFlags: {
            ...(claim.aiFlags as object ?? {}),
            latestFraudCheck: {
              score: fraudRiskScore,
              level: fraudRiskLevel,
              action: recommendedAction,
              assessmentId: assessment.id,
              checkedAt: new Date().toISOString(),
            },
          },
        },
      });
    }

    // ── 7. Log activity ───────────────────────────────────────────────────
    await prisma.activity.create({
      data: {
        type: 'AI_ANALYSIS_RUN',
        title: 'Fraud check performed',
        description: `Fraud assessment completed for claim ${claim.claimNumber} — Score: ${fraudRiskScore}/100 (${fraudRiskLevel})`,
        userId: session.user.id,
        clientId: claim.clientId,
        claimId: id,
      },
    });

    // ── 8. Return structured response ─────────────────────────────────────
    return NextResponse.json({
      fraud_risk_score: fraudRiskScore,
      fraud_risk_level: fraudRiskLevel,
      risk_factors: riskFactors,
      recommended_action: recommendedAction,
      explanation: fraudResult.explanation,
      assessment_id: assessment.id,
      triggered_escalation: triggeredEscalation,
      escalation_id: escalationId ?? null,
      context: {
        total_claims: totalClaims,
        recent_claims_12mo: recentClaims,
        prior_settled_claims: priorSettledClaims,
        estimated_loss: claim.estimatedLoss ? Number(claim.estimatedLoss) : null,
      },
    });
  } catch (error: any) {
    console.error('[fraud-check POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Fraud check failed' },
      { status: 500 }
    );
  }
}
