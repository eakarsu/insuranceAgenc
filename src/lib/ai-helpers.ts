/**
 * Shared AI helpers + prompt registry for the insurance-agency app.
 *
 * Replaces the duplicated OpenRouter fetches in /api/ai/chat, /api/ai/stream,
 * /api/ai/smart-search, /api/ai/coverage-advisor, and lib/ai-claims-service.ts.
 *
 *   - Standard model: anthropic/claude-3-5-sonnet-20241022 (env-overridable).
 *   - Per-user AI rate limiter: 20 calls / hour / user.
 *   - 3-strategy JSON parser (handles fenced + balanced JSON).
 *   - Centralized SYSTEM_PROMPTS registry (single source of truth).
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3-5-sonnet-20241022";

// ============= Prompt registry =============

export const SYSTEM_PROMPTS: Record<string, string> = {
  quote_generator: `You are a senior insurance underwriter and AI quote generator with 20+ years of experience. Analyze client risk profiles and generate accurate, competitive premium estimates. Format your response as JSON with premium, coverages, recommendations, riskFactors, discountsApplied, and competitivePosition keys.`,
  coverage_analyzer: `You are an expert insurance coverage analyst. Identify dangerous coverage gaps and E&O risks. Format your response as JSON with gaps, recommendations, riskScore, explanation, and policyCoordination keys.`,
  claims_assistant: `You are an experienced claims adjuster specializing in FNOL processing. Format your response as JSON with claimType, coverage, nextSteps, documentation, reserveRecommendation, subrogationPotential, and redFlags keys.`,
  renewal_predictor: `You are an insurance data scientist specializing in client retention and renewal prediction. Format your response as JSON with retentionScore, riskFactors, strategies, projectedPremium, timeline, and confidenceLevel keys.`,
  cross_sell: `You are an insurance sales strategist specializing in account rounding. Format your response as JSON with recommendations and accountAnalysis keys.`,
  risk_assessor: `You are a senior underwriting risk analyst. Evaluate risk factors using actuarial principles. Format your response as JSON with riskScore, factors, recommendations, pricing, and benchmarkComparison keys.`,
  document_processor: `You are an AI document processor specializing in insurance documents. Extract all relevant data fields. Format your response as JSON with documentType, extractedFields, summary, confidence, warnings, missingFields, and crossReferenceNotes keys.`,
  email_composer: `You are a professional insurance communications specialist. Draft polished, compliant emails. Format your response as JSON with subject, body, tone, suggestedFollowUp, and complianceNotes keys.`,
  smart_search: `You are an AI search assistant for an insurance agency management system. Translate natural language queries into precise structured search parameters. Format your response as JSON with interpretation, entityType, filters, and sortBy keys.`,
  client_summary: `You are a senior insurance account manager. Generate comprehensive client intelligence reports. Format your response as JSON with overview, riskProfile, portfolioAnalysis, lifetimeValue, keyDates, recommendations, and retentionRisk keys.`,
  claim_summarizer: `You are a senior claims examiner. Create executive claim summaries for management review. Format your response as JSON with executiveSummary, timeline, keyFacts, outstandingActions, riskAssessment, and litigationStatus keys.`,
  policy_comparison: `You are an insurance policy analyst. Compare policies side-by-side. Format your response as JSON with comparison, differences, recommendation, and costAnalysis keys.`,
  sentiment_analysis: `You are a client communication analyst. Analyze emotional tone and satisfaction level. Format your response as JSON with overallSentiment, score, emotions, keyPhrases, urgencyLevel, escalationRisk, and suggestedResponse keys.`,
  loss_run_analyzer: `You are an insurance underwriting analyst specializing in loss run analysis. Extract claims, frequencies, severities, and trends. Format your response as JSON with summary, claims, patterns, trends, riskFactors, premiumImpact, and recommendations keys.`,
  endorsement_recommender: `You are an insurance product specialist. Recommend specific endorsements based on risk profile. Format your response as JSON with endorsements, reasoning, totalEstimatedCost, priorityActions, and bundlingOpportunities keys.`,
  compliance_checker: `You are an insurance compliance officer. Identify compliance risks before they become violations. Format your response as JSON with complianceScore, violations, warnings, requiredDisclosures, recommendations, regulatoryReferences, and eoExposure keys.`,
  underwriting_narrator: `You are a senior insurance underwriter. Write a concise (≤180 words) audit-ready narrative justifying an underwriting decision. Reference relevant ISO forms, exclusions, and rate factors. Reply STRICT JSON {"narrative": "...", "rationaleBullets": ["..."], "eoExposure": "low|medium|high"}.`,
  fnol_extractor: `You are an FNOL intake specialist. Extract structured first-notice-of-loss fields from a free-form caller utterance. Reply STRICT JSON: {"isClaim": bool, "lossDate": "YYYY-MM-DD"|null, "lossType": "auto|property|liability|other", "lossLocation": "", "description": "", "injuriesReported": bool, "policeReportNumber": null|string, "estimatedDamage": number|null, "missingFields": ["..."]}.`,
};

export const TEMPERATURE_MAP: Record<string, number> = {
  quote_generator: 0.4,
  coverage_analyzer: 0.3,
  claims_assistant: 0.4,
  renewal_predictor: 0.3,
  cross_sell: 0.5,
  risk_assessor: 0.3,
  document_processor: 0.2,
  email_composer: 0.7,
  smart_search: 0.2,
  client_summary: 0.4,
  claim_summarizer: 0.3,
  policy_comparison: 0.3,
  sentiment_analysis: 0.3,
  loss_run_analyzer: 0.3,
  endorsement_recommender: 0.4,
  compliance_checker: 0.2,
  underwriting_narrator: 0.3,
  fnol_extractor: 0.2,
};

// ============= Per-user AI rate limit (20 / hour / user) =============

interface RateBucket {
  count: number;
  resetAt: number;
}
const aiBuckets = new Map<string, RateBucket>();
const AI_WINDOW_MS = 60 * 60 * 1000;
const AI_MAX_CALLS = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || "20", 10);

export interface AiRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function aiRateLimiter(userKey: string): AiRateLimitResult {
  const now = Date.now();
  const b = aiBuckets.get(userKey);
  if (!b || now > b.resetAt) {
    aiBuckets.set(userKey, { count: 1, resetAt: now + AI_WINDOW_MS });
    return { allowed: true, remaining: AI_MAX_CALLS - 1, resetAt: now + AI_WINDOW_MS };
  }
  if (b.count >= AI_MAX_CALLS) {
    return { allowed: false, remaining: 0, resetAt: b.resetAt };
  }
  b.count++;
  return { allowed: true, remaining: AI_MAX_CALLS - b.count, resetAt: b.resetAt };
}

// ============= 3-strategy JSON parser =============

function stripFences(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    const nl = t.indexOf("\n");
    if (nl !== -1) t = t.slice(nl + 1);
    if (t.endsWith("```")) t = t.slice(0, -3);
  }
  return t.trim();
}

function sanitizeNewlinesInsideStrings(raw: string): string {
  return raw.replace(/"(?:[^"\\]|\\.)*"/g, (m) =>
    m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t"),
  );
}

function balancedJson(content: string): string | null {
  const first = content.indexOf("{");
  if (first === -1) return null;
  let depth = 0,
    inStr = false,
    esc = false,
    last = -1;
  for (let i = first; i < content.length; i++) {
    const ch = content[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) { last = i; break; }
    }
  }
  if (last === -1) return null;
  return content.substring(first, last + 1);
}

export function parseAIJson<T = any>(raw: string): T {
  const stripped = stripFences(raw);
  try { return JSON.parse(stripped) as T; } catch {}
  try { return JSON.parse(sanitizeNewlinesInsideStrings(stripped)) as T; } catch {}
  const block = balancedJson(stripped);
  if (block) {
    try { return JSON.parse(block) as T; } catch {}
    try { return JSON.parse(sanitizeNewlinesInsideStrings(block)) as T; } catch {}
  }
  throw new Error(
    `parseAIJson: failed to parse AI response after 3 strategies. raw=${raw.slice(0, 240)}…`,
  );
}

// ============= OpenRouter caller =============

export class AiUnavailableError extends Error {}

export interface CallOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export async function callOpenRouter(
  systemPrompt: string,
  userPrompt: string,
  opts: CallOptions = {},
): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new AiUnavailableError(
      "OPENROUTER_API_KEY is not set — AI features disabled.",
    );
  }

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 60_000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "Insurance Agency AI",
      },
      body: JSON.stringify({
        model: opts.model || OPENROUTER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: opts.temperature ?? 0.4,
        max_tokens: opts.maxTokens ?? 1500,
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 240)}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned empty content");
    return content;
  } finally {
    clearTimeout(t);
  }
}

export async function callOpenRouterJson<T = any>(
  systemPrompt: string,
  userPrompt: string,
  opts: CallOptions = {},
): Promise<T> {
  const raw = await callOpenRouter(systemPrompt, userPrompt, {
    ...opts,
    jsonMode: opts.jsonMode ?? true,
  });
  return parseAIJson<T>(raw);
}

// ============= Helper: log to AiResult JSONB =============

import prisma from "./prisma";

export async function logAiResult(args: {
  feature: string;
  userId?: string | null;
  refType?: string;
  refId?: string;
  input?: unknown;
  output?: unknown;
  rawText?: string;
  error?: string;
  durationMs: number;
}) {
  try {
    await prisma.aiResult.create({
      data: {
        feature: args.feature,
        userId: args.userId || null,
        model: OPENROUTER_MODEL,
        refType: args.refType,
        refId: args.refId,
        input: args.input as any,
        output: (args.output as any) ?? undefined,
        rawText: args.rawText,
        error: args.error,
        durationMs: args.durationMs,
      },
    });
  } catch (err) {
    console.error("Failed to persist AiResult", err);
  }
}
