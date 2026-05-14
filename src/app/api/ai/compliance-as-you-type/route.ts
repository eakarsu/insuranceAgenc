/**
 * NEW FEATURE 4 — Compliance-as-you-type.
 *
 * Synchronous compliance gate that the policies/endorsements forms call before
 * persisting. Runs the LLM compliance_checker prompt against the proposed
 * payload, persists a ComplianceCheckResult, and returns:
 *   { blocking: bool, complianceScore, violations[], warnings[], recommendations[] }
 *
 * The caller decides whether to block save (blocking=true) or merely warn.
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

  const { refType, refId, payload, state } = await request.json();
  if (!refType || !payload) {
    return NextResponse.json({ error: "refType and payload required" }, { status: 400 });
  }

  const t0 = Date.now();
  let parsed: any = {};
  let errorMsg: string | undefined;
  try {
    parsed = await callOpenRouterJson(
      SYSTEM_PROMPTS.compliance_checker,
      `State: ${state || "unspecified"}\nProposed ${refType}:\n${JSON.stringify(payload).slice(0, 8000)}`,
      { temperature: TEMPERATURE_MAP.compliance_checker, maxTokens: 1500 },
    );
  } catch (err: any) {
    errorMsg = err?.message || String(err);
  }

  const violations = parsed.violations || [];
  const warnings = parsed.warnings || [];
  const blocking =
    Array.isArray(violations) && violations.length > 0
      ? true
      : (parsed.eoExposure === "high" || parsed.complianceScore < 0.5);

  const row = await prisma.complianceCheckResult.create({
    data: {
      refType,
      refId: refId || "(draft)",
      blocking,
      complianceScore: typeof parsed.complianceScore === "number" ? parsed.complianceScore : null,
      violations,
      warnings,
      recommendations: parsed.recommendations || [],
      raw: parsed,
    },
  });

  await logAiResult({
    feature: "compliance_as_you_type",
    userId: userKey,
    refType,
    refId: refId || row.id,
    input: { state, payloadKeys: Object.keys(payload || {}) },
    output: parsed,
    error: errorMsg,
    durationMs: Date.now() - t0,
  });

  if (errorMsg && !parsed.violations) {
    return NextResponse.json(
      { error: "Compliance AI failed", detail: errorMsg, blocking: false },
      { status: errorMsg.includes("OPENROUTER_API_KEY") ? 503 : 500 },
    );
  }

  return NextResponse.json({
    id: row.id,
    blocking,
    complianceScore: row.complianceScore,
    violations,
    warnings,
    recommendations: row.recommendations,
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") || "20")));

  const [data, total] = await Promise.all([
    prisma.complianceCheckResult.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.complianceCheckResult.count(),
  ]);
  return NextResponse.json({
    data,
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  });
}
