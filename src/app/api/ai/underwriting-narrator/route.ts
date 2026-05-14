/**
 * NEW FEATURE 1 — Underwriting Decision Narrator.
 *
 * Every policy issuance / quote decision can be narrated by the AI to produce
 * an audit-ready rationale. The narrative + bullet list are stored on
 * `UnderwritingNarrative` and an `AiResult` row, attached to the source
 * Policy or Quote via (refType, refId).
 *
 * POST /api/ai/underwriting-narrator
 *   body: { refType: "Policy"|"Quote", refId, decision }
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

  const { refType, refId, decision } = await request.json();
  if (!refType || !refId) {
    return NextResponse.json({ error: "refType and refId are required" }, { status: 400 });
  }
  if (!["Policy", "Quote"].includes(refType)) {
    return NextResponse.json({ error: "refType must be Policy or Quote" }, { status: 400 });
  }

  // Build context from the source row
  let context: any = {};
  if (refType === "Policy") {
    const p = await prisma.policy.findUnique({
      where: { id: refId },
      include: {
        client: true,
        carrier: { select: { name: true } },
        quote: { select: { totalPremium: true, riskInfo: true } },
      },
    });
    if (!p) return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    context = {
      policyNumber: p.policyNumber,
      lineOfBusiness: p.lineOfBusiness,
      premium: p.premium,
      effectiveDate: p.effectiveDate,
      expirationDate: p.expirationDate,
      coverageSummary: p.coverageSummary,
      deductibles: p.deductibles,
      limits: p.limits,
      carrier: p.carrier?.name,
      clientName: `${p.client.firstName ?? ""} ${p.client.lastName ?? ""}`.trim(),
      relatedQuote: p.quote ?? null,
    };
  } else {
    const q = await prisma.quote.findUnique({
      where: { id: refId },
      include: { client: true, carrier: { select: { name: true } } },
    });
    if (!q) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    context = {
      quoteNumber: q.quoteNumber,
      lineOfBusiness: q.lineOfBusiness,
      totalPremium: q.totalPremium,
      effectiveDate: q.effectiveDate,
      riskInfo: q.riskInfo,
      carrierQuotes: q.carrierQuotes,
      carrier: q.carrier?.name,
      clientName: `${q.client.firstName ?? ""} ${q.client.lastName ?? ""}`.trim(),
    };
  }

  const t0 = Date.now();
  let parsed: any = {};
  let raw = "";
  let errorMsg: string | undefined;
  try {
    parsed = await callOpenRouterJson(
      SYSTEM_PROMPTS.underwriting_narrator,
      `Decision: ${decision || "BIND"}\n\nUnderwriting context:\n${JSON.stringify(context, null, 2)}`,
      { temperature: TEMPERATURE_MAP.underwriting_narrator, maxTokens: 700 },
    );
  } catch (err: any) {
    errorMsg = err?.message || String(err);
  }

  const narrativeRow = errorMsg
    ? null
    : await prisma.underwritingNarrative.create({
        data: {
          refType,
          refId,
          decision: decision || "BIND",
          narrative: parsed.narrative || "(no narrative produced)",
          rationaleBullets: parsed.rationaleBullets || [],
          eoExposure: parsed.eoExposure || "low",
          createdById: (session.user as any)?.id || null,
        },
      });

  await logAiResult({
    feature: "underwriting_narrator",
    userId: userKey,
    refType,
    refId,
    input: { decision },
    output: parsed,
    rawText: raw,
    error: errorMsg,
    durationMs: Date.now() - t0,
  });

  if (errorMsg) {
    return NextResponse.json(
      { error: "Underwriting narrator failed", detail: errorMsg },
      { status: errorMsg.includes("OPENROUTER_API_KEY") ? 503 : 500 },
    );
  }

  return NextResponse.json(narrativeRow);
}

// GET — list paginated narratives, optionally filtered by ref
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") || "20")));
  const refType = sp.get("refType") || undefined;
  const refId = sp.get("refId") || undefined;

  const where: any = {};
  if (refType) where.refType = refType;
  if (refId) where.refId = refId;

  const [data, total] = await Promise.all([
    prisma.underwritingNarrative.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.underwritingNarrative.count({ where }),
  ]);

  return NextResponse.json({
    data,
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  });
}
