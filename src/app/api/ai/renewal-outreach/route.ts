/**
 * NEW FEATURE 3 — Renewal-risk auto-outreach.
 *
 * Scans policies expiring within the next 90 days, asks the LLM for a
 * retention score (per policy) and a personalized outreach email draft.
 * Persists RenewalRiskScore rows; the caller can mark `outreachDrafted` and
 * later send via the email service.
 *
 * POST  ?days=90        recompute scores for all expiring policies
 * GET                   list paginated risk scores newest first
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  aiRateLimiter,
  callOpenRouterJson,
  SYSTEM_PROMPTS,
  TEMPERATURE_MAP,
  logAiResult,
} from "@/lib/ai-helpers";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") || "20")));

  const [data, total] = await Promise.all([
    prisma.renewalRiskScore.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.renewalRiskScore.count(),
  ]);
  return NextResponse.json({
    data,
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userKey = (session.user as any)?.id || (session.user as any)?.email || "anon";

  const limit = aiRateLimiter(userKey);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "AI rate limit exceeded", resetAt: new Date(limit.resetAt).toISOString() },
      { status: 429 },
    );
  }

  const sp = request.nextUrl.searchParams;
  const days = Math.min(180, Math.max(1, parseInt(sp.get("days") || "90")));

  const expiringSoon = await prisma.policy.findMany({
    where: {
      status: "ACTIVE",
      expirationDate: {
        gte: new Date(),
        lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      client: true,
      claims: true,
      payments: { take: 5, orderBy: { createdAt: "desc" } },
    },
    take: 50,
  });

  if (expiringSoon.length === 0) {
    return NextResponse.json({ ok: true, scored: 0, message: "No policies expiring soon." });
  }

  let scored = 0;
  const results: any[] = [];
  for (const policy of expiringSoon) {
    const t0 = Date.now();
    const ctx = {
      policyNumber: policy.policyNumber,
      lineOfBusiness: policy.lineOfBusiness,
      premium: policy.premium,
      effectiveDate: policy.effectiveDate,
      expirationDate: policy.expirationDate,
      clientName: `${policy.client.firstName ?? ""} ${policy.client.lastName ?? ""}`.trim(),
      claimCount: policy.claims.length,
      lastPayment: policy.payments[0]
        ? { amount: (policy.payments[0] as any).amount, when: (policy.payments[0] as any).createdAt }
        : null,
    };

    let parsed: any = {};
    let errorMsg: string | undefined;
    try {
      parsed = await callOpenRouterJson(
        SYSTEM_PROMPTS.renewal_predictor +
          ` Then add a key "outreachEmail" with a personalized retention email body (≤200 words).`,
        JSON.stringify(ctx),
        { temperature: TEMPERATURE_MAP.renewal_predictor, maxTokens: 1200 },
      );
    } catch (err: any) {
      errorMsg = err?.message || String(err);
    }

    const daysToRenewal = Math.max(
      0,
      Math.ceil((new Date(policy.expirationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    );
    const row = await prisma.renewalRiskScore.create({
      data: {
        policyId: policy.id,
        daysToRenewal,
        retentionScore:
          typeof parsed.retentionScore === "number" ? parsed.retentionScore : 0.5,
        riskFactors: parsed.riskFactors || [],
        strategies: parsed.strategies || [],
        outreachDrafted: !!parsed.outreachEmail && !errorMsg,
        outreachContent: parsed.outreachEmail || null,
      },
    });
    results.push(row);
    scored++;

    await logAiResult({
      feature: "renewal_outreach",
      userId: userKey,
      refType: "Policy",
      refId: policy.id,
      input: ctx,
      output: parsed,
      error: errorMsg,
      durationMs: Date.now() - t0,
    });
  }

  return NextResponse.json({ ok: true, scored, results });
}
