import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyzeClaim, detectFraud } from '@/lib/ai-claims-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const claim = await prisma.claim.findUnique({
      where: { id },
      select: {
        id: true,
        claimNumber: true,
        aiClassification: true,
        aiRiskScore: true,
        aiFlags: true,
      },
    });

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

    return NextResponse.json({
      claimId: claim.id,
      claimNumber: claim.claimNumber,
      classification: claim.aiClassification,
      riskScore: claim.aiRiskScore,
      flags: claim.aiFlags,
    });
  } catch (error) {
    console.error('AI Analysis GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch AI analysis' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: {
        client: { select: { id: true } },
      },
    });

    if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

    // Count client's claims for fraud detection context
    const [totalClaims, recentClaims] = await Promise.all([
      prisma.claim.count({ where: { clientId: claim.clientId } }),
      prisma.claim.count({
        where: {
          clientId: claim.clientId,
          dateReported: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    // Run both analyses in parallel
    const [claimAnalysis, fraudDetection] = await Promise.all([
      analyzeClaim({
        type: claim.type,
        description: claim.description,
        estimatedLoss: claim.estimatedLoss ? Number(claim.estimatedLoss) : null,
        dateOfLoss: claim.dateOfLoss.toISOString(),
        lossLocation: claim.lossLocation,
        claimNumber: claim.claimNumber,
        status: claim.status,
      }),
      detectFraud({
        type: claim.type,
        description: claim.description,
        estimatedLoss: claim.estimatedLoss ? Number(claim.estimatedLoss) : null,
        dateOfLoss: claim.dateOfLoss.toISOString(),
        dateReported: claim.dateReported.toISOString(),
        lossLocation: claim.lossLocation,
        claimNumber: claim.claimNumber,
        clientHistory: { totalClaims, recentClaims },
      }),
    ]);

    // Use the max risk score from both analyses
    const riskScore = Math.max(claimAnalysis.riskScore, fraudDetection.fraudRiskScore);

    // Update claim with AI fields
    await prisma.claim.update({
      where: { id },
      data: {
        aiClassification: claimAnalysis.classification,
        aiRiskScore: riskScore,
        aiFlags: {
          claimAnalysis: {
            flags: claimAnalysis.flags,
            recommendations: claimAnalysis.recommendations,
            summary: claimAnalysis.summary,
          },
          fraudDetection: {
            indicators: fraudDetection.indicators,
            explanation: fraudDetection.explanation,
            recommendation: fraudDetection.recommendation,
          },
          analyzedAt: new Date().toISOString(),
        },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'AI_ANALYSIS_RUN',
        title: 'AI analysis performed',
        description: `AI analysis run on claim ${claim.claimNumber} - Risk Score: ${riskScore.toFixed(2)}`,
        userId: session.user.id,
        clientId: claim.clientId,
        claimId: claim.id,
      },
    });

    return NextResponse.json({
      claimAnalysis,
      fraudDetection,
      riskScore,
      classification: claimAnalysis.classification,
    });
  } catch (error) {
    console.error('AI Analysis POST error:', error);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
