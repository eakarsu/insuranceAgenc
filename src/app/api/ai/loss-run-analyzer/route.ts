/**
 * NEW FEATURE 2 — Loss-run analyzer with PDF ingestion.
 *
 * Accepts an ACORD loss-run PDF (or plain text). Extracts text via the bundled
 * PDF utility (puppeteer is for *generation*, but for ingestion we use a
 * lightweight base64+pdf-parse path), then asks the LLM to extract claims +
 * a summary. Persists a LossRunIngestion row and updates the linked Quote's
 * `riskInfo` JSON with `priorClaims`.
 *
 * POST body (JSON):
 *   { quoteId?: string, fileName: string, fileBase64?: string, text?: string }
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

async function pdfBase64ToText(b64: string): Promise<string> {
  // Use pdf-parse if installed; otherwise fall back to regex-stripped text.
  // Use a string-based dynamic import so TypeScript doesn't require the optional types.
  try {
    const buf = Buffer.from(b64, "base64");
    const dynamicImport = new Function("p", "return import(p)") as (p: string) => Promise<any>;
    try {
      const mod = await dynamicImport("pdf-parse");
      if (mod) {
        const fn = mod.default || mod;
        const out = await fn(buf);
        return out.text || "";
      }
    } catch {
      /* fall through to ASCII fallback */
    }
    return buf.toString("utf-8").replace(/[^\x20-\x7E\n\r]+/g, " ");
  } catch {
    return "";
  }
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

  const { quoteId, fileName, fileBase64, text } = await request.json();
  if (!fileName || (!fileBase64 && !text)) {
    return NextResponse.json(
      { error: "fileName and (fileBase64 or text) are required" },
      { status: 400 },
    );
  }

  let body = text || "";
  let bytes = text ? Buffer.byteLength(text) : 0;
  if (fileBase64) {
    body = await pdfBase64ToText(fileBase64);
    bytes = Math.floor((fileBase64.length * 3) / 4);
  }
  if (!body) {
    return NextResponse.json({ error: "Failed to extract any text from the document." }, { status: 422 });
  }

  const t0 = Date.now();
  let parsed: any = {};
  let errorMsg: string | undefined;
  try {
    parsed = await callOpenRouterJson(
      SYSTEM_PROMPTS.loss_run_analyzer,
      `File: ${fileName}\n\nExtracted text (truncated):\n${body.slice(0, 16000)}`,
      { temperature: TEMPERATURE_MAP.loss_run_analyzer, maxTokens: 2500 },
    );
  } catch (err: any) {
    errorMsg = err?.message || String(err);
  }

  const ingestion = await prisma.lossRunIngestion.create({
    data: {
      quoteId: quoteId || null,
      fileName,
      fileBytes: bytes,
      extractedClaims: parsed.claims || parsed.extractedClaims || [],
      summary: parsed.summary || null,
      patterns: parsed.patterns || null,
      premiumImpactPct:
        typeof parsed.premiumImpact === "number"
          ? parsed.premiumImpact
          : parsed.premiumImpact?.estimatedPct ?? null,
      status: errorMsg ? "error" : "processed",
      errorText: errorMsg,
    },
  });

  // Auto-fill the quote's riskInfo.priorClaims if a quoteId was provided.
  if (quoteId && !errorMsg) {
    try {
      const q = await prisma.quote.findUnique({ where: { id: quoteId } });
      if (q) {
        const existing = (q.riskInfo as any) || {};
        existing.priorClaims = parsed.claims || parsed.extractedClaims || [];
        existing.lossRunSummary = parsed.summary;
        await prisma.quote.update({ where: { id: quoteId }, data: { riskInfo: existing } });
      }
    } catch (e) {
      console.warn("Failed to update Quote.riskInfo with loss-run data", e);
    }
  }

  await logAiResult({
    feature: "loss_run_analyzer",
    userId: userKey,
    refType: "LossRunIngestion",
    refId: ingestion.id,
    input: { fileName, bytes, quoteId },
    output: parsed,
    error: errorMsg,
    durationMs: Date.now() - t0,
  });

  if (errorMsg) {
    return NextResponse.json(
      { ingestion, error: "Loss-run AI failed", detail: errorMsg },
      { status: errorMsg.includes("OPENROUTER_API_KEY") ? 503 : 500 },
    );
  }
  return NextResponse.json({ ingestion, parsed });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(sp.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(sp.get("pageSize") || "20")));
  const quoteId = sp.get("quoteId") || undefined;

  const where = quoteId ? { quoteId } : {};
  const [data, total] = await Promise.all([
    prisma.lossRunIngestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lossRunIngestion.count({ where }),
  ]);

  return NextResponse.json({
    data,
    pagination: { page, pageSize, totalItems: total, totalPages: Math.ceil(total / pageSize) },
  });
}
