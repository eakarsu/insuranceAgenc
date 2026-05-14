import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  aiRateLimiter,
  callOpenRouter,
  AiUnavailableError,
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

  const { messages, context } = await request.json();
  const systemMessage = `You are a senior insurance industry consultant with 25+ years of experience across personal lines, commercial lines, surplus lines, and reinsurance. You serve as a trusted advisor to insurance agents, CSRs, and agency principals.

Your expertise includes:
- All personal lines (auto, homeowners, renters, umbrella, flood, earthquake, personal articles)
- All commercial lines (BOP, GL, commercial property, commercial auto, workers comp, professional liability, D&O, EPLI, cyber, inland marine)
- Life & health (term, whole, universal, group health, disability, long-term care)
- Surplus/E&S markets for hard-to-place risks
- Insurance regulations across all 50 states and territories
- Claims handling, subrogation, and reserving
- Agency operations, producer management, and E&O prevention
- Coverage forms (ISO, AAIS, proprietary) and their key exclusions
- Rating, underwriting, and actuarial concepts

${context ? `Current context: ${JSON.stringify(context)}` : ""}

Guidelines:
- Reference specific policy forms (e.g., HO-3, CP 00 10, CG 00 01), endorsements, and exclusion numbers when relevant
- Cite specific state regulations when discussing compliance (e.g., "In Texas, TDI requires...")
- When discussing coverage questions, always note the importance of reading the specific policy language
- Provide practical, actionable advice that agents can implement immediately
- When calculations are involved, show your work and explain the methodology
- Flag E&O exposure risks when you see them in the scenario described
- If a question involves potential legal advice, recommend consulting with an insurance attorney
- When unsure about jurisdiction-specific rules, say so and recommend verifying with the state DOI
- Always consider both the client's protection needs and the agency's E&O exposure`;

  const userPrompt = (messages || [])
    .map((m: any) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const t0 = Date.now();
  let raw = "";
  try {
    raw = await callOpenRouter(systemMessage, userPrompt, {
      temperature: 0.6,
      maxTokens: 5000,
    });
    await logAiResult({
      feature: "chat",
      userId: userKey,
      input: { messageCount: messages?.length, hasContext: !!context },
      output: { length: raw.length },
      durationMs: Date.now() - t0,
    });
    return NextResponse.json({ message: raw });
  } catch (err: any) {
    await logAiResult({
      feature: "chat",
      userId: userKey,
      input: { messageCount: messages?.length },
      error: err?.message || String(err),
      durationMs: Date.now() - t0,
    });
    if (err instanceof AiUnavailableError) {
      return NextResponse.json(
        { error: "AI is not configured on this server" },
        { status: 503 },
      );
    }
    // Do NOT leak provider error message to the client.
    console.error("Chat API error:", err);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
