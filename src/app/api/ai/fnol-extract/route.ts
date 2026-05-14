/**
 * NEW FEATURE 5 — Voice-call → FNOL claim draft.
 *
 * Called by the Twilio voice agent (and by manual UI testing). Given a caller
 * utterance + optional callSid, the LLM extracts FNOL fields and writes a
 * FNOLDraft row with a confirmation number. The Twilio agent reads the
 * confirmation number back to the caller before hangup.
 *
 * POST body:
 *   { utterance: string, callSid?: string, callerPhone?: string,
 *     existingDraftId?: string, policyNumber?: string }
 *
 * Response: { draft, missingFields, response, confirmationNumber, complete }
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  callOpenRouterJson,
  SYSTEM_PROMPTS,
  TEMPERATURE_MAP,
  logAiResult,
} from "@/lib/ai-helpers";

function newConfirmationNumber(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `FNOL-${t}-${r}`;
}

export async function POST(request: NextRequest) {
  // Voice webhook is unauthenticated — guarded by Twilio signature in middleware.
  const { utterance, callSid, callerPhone, existingDraftId, policyNumber } = await request.json();
  if (!utterance) {
    return NextResponse.json({ error: "utterance is required" }, { status: 400 });
  }

  // Find or create the draft
  let draft = existingDraftId
    ? await prisma.fNOLDraft.findUnique({ where: { id: existingDraftId } })
    : callSid
      ? await prisma.fNOLDraft.findFirst({ where: { callSid }, orderBy: { createdAt: "desc" } })
      : null;

  if (!draft) {
    draft = await prisma.fNOLDraft.create({
      data: {
        callSid: callSid || null,
        callerPhone: callerPhone || null,
        policyNumber: policyNumber || null,
        confirmationNumber: newConfirmationNumber(),
        status: "draft",
      },
    });
  }

  const t0 = Date.now();
  let parsed: any = {};
  let errorMsg: string | undefined;
  try {
    parsed = await callOpenRouterJson(
      SYSTEM_PROMPTS.fnol_extractor,
      `Caller utterance: "${utterance}"\n\nDraft so far: ${JSON.stringify({
        lossDate: draft.lossDate,
        lossType: draft.lossType,
        description: draft.description,
        injuriesReported: draft.injuriesReported,
        policeReportNumber: draft.policeReportNumber,
        estimatedDamage: draft.estimatedDamage,
      })}`,
      { temperature: TEMPERATURE_MAP.fnol_extractor, maxTokens: 800 },
    );
  } catch (err: any) {
    errorMsg = err?.message || String(err);
  }

  // Merge non-null fields onto the draft
  const merged: any = {};
  if (parsed?.lossDate) merged.lossDate = new Date(parsed.lossDate);
  if (parsed?.lossType) merged.lossType = parsed.lossType;
  if (parsed?.description) merged.description = parsed.description;
  if (typeof parsed?.injuriesReported === "boolean") merged.injuriesReported = parsed.injuriesReported;
  if (parsed?.policeReportNumber) merged.policeReportNumber = parsed.policeReportNumber;
  if (typeof parsed?.estimatedDamage === "number") merged.estimatedDamage = parsed.estimatedDamage;

  const missingFields = parsed?.missingFields || [];

  draft = await prisma.fNOLDraft.update({
    where: { id: draft.id },
    data: { ...merged, missingFields, status: missingFields.length === 0 ? "confirmed" : "draft" },
  });

  await logAiResult({
    feature: "fnol_extract",
    refType: "FNOLDraft",
    refId: draft.id,
    input: { utterance, callSid, callerPhone },
    output: parsed,
    error: errorMsg,
    durationMs: Date.now() - t0,
  });

  // Build a response the voice agent can speak
  let speech = "";
  if (errorMsg) {
    speech = "I'm having trouble understanding right now. Let me transfer you to an agent.";
  } else if (missingFields.length > 0) {
    speech = `Thanks. Could you tell me ${missingFields[0].replace(/([A-Z])/g, " $1").toLowerCase()}?`;
  } else {
    speech = `Got it. I've created claim draft ${draft.confirmationNumber}. An adjuster will contact you within one business day.`;
  }

  return NextResponse.json({
    draft,
    missingFields,
    response: speech,
    confirmationNumber: draft.confirmationNumber,
    complete: missingFields.length === 0,
  });
}

// GET — paginated drafts (agents review/promote)
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") || "20")));
  const status = sp.get("status") || undefined;

  const where = status ? { status } : {};
  const [data, total] = await Promise.all([
    prisma.fNOLDraft.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.fNOLDraft.count({ where }),
  ]);
  return NextResponse.json({
    data,
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  });
}
