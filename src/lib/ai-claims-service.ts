const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku';

// ==================== Types ====================

export interface ClaimAnalysisResult {
  classification: string;
  riskScore: number;
  flags: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }>;
  recommendations: string[];
  summary: string;
}

export interface DocumentAnalysisResult {
  authenticityScore: number;
  completenessScore: number;
  relevanceScore: number;
  keyDataPoints: Array<{ field: string; value: string }>;
  flags: string[];
  overallAssessment: string;
}

export interface FraudDetectionResult {
  fraudRiskScore: number;
  indicators: Array<{
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
  }>;
  explanation: string;
  recommendation: string;
}

// ==================== Helpers ====================

async function callOpenRouter(systemPrompt: string, userPrompt: string, temperature = 0.3): Promise<any> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 5000,
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty AI response');

  // Fix literal newlines inside JSON string values
  function sanitize(raw: string): string {
    return raw.replace(/"(?:[^"\\]|\\.)*"/g, (m) =>
      m.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')
    );
  }

  // Try direct parse, then sanitized parse
  const trimmed = content.trim();
  try { return JSON.parse(trimmed); } catch {}
  try { return JSON.parse(sanitize(trimmed)); } catch {}

  // Extract JSON with balanced braces
  const first = content.indexOf('{');
  if (first !== -1) {
    let depth = 0, inStr = false, esc = false, last = -1;
    for (let i = first; i < content.length; i++) {
      const ch = content[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { last = i; break; } }
    }
    if (last !== -1) {
      const str = content.substring(first, last + 1);
      try { return JSON.parse(str); } catch {}
      try { return JSON.parse(sanitize(str)); } catch {}
    }
  }

  throw new Error('Failed to parse AI response as JSON');
}

// ==================== Analysis Functions ====================

export async function analyzeClaim(claim: {
  type: string;
  description: string;
  estimatedLoss: number | null;
  dateOfLoss: string;
  lossLocation: string | null;
  claimNumber: string;
  status: string;
}): Promise<ClaimAnalysisResult> {
  const defaultResult: ClaimAnalysisResult = {
    classification: 'PENDING_REVIEW',
    riskScore: 0.5,
    flags: [],
    recommendations: ['Manual review recommended'],
    summary: 'AI analysis unavailable - manual review required.',
  };

  try {
    const systemPrompt = `You are a senior insurance claims examiner with 20+ years of experience in multi-line claims handling, fraud detection, and reserve analysis. You specialize in initial claim triage and risk classification.

When analyzing a claim, evaluate these factors:
1. Consistency of the loss description with the reported cause and circumstances
2. Timing patterns (date of loss vs. date reported, proximity to policy inception/cancellation)
3. Loss amount relative to coverage type and typical claims for this category
4. Geographic and seasonal factors affecting the claim type
5. Description red flags (vague details, inconsistencies, unusual circumstances)
6. Policy coverage applicability and potential exclusions
7. Potential for subrogation or third-party recovery
8. Reserve adequacy based on the initial loss description

Respond ONLY with valid JSON matching this schema:
{
  "classification": "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "SUSPICIOUS" | "LEGITIMATE",
  "riskScore": number between 0 and 1 (0 = no risk, 1 = highest risk),
  "flags": [{ "type": string, "severity": "LOW" | "MEDIUM" | "HIGH", "description": string }],
  "recommendations": [string - specific, actionable next steps],
  "summary": string - 2-3 paragraph detailed analysis
}`;

    const userPrompt = `Analyze this insurance claim for risk assessment and triage:
- Claim #: ${claim.claimNumber}
- Type: ${claim.type}
- Status: ${claim.status}
- Description: ${claim.description}
- Date of Loss: ${claim.dateOfLoss}
- Loss Location: ${claim.lossLocation || 'Not specified'}
- Estimated Loss Amount: ${claim.estimatedLoss ? `$${Number(claim.estimatedLoss).toLocaleString()}` : 'Not specified'}

Provide a thorough risk assessment considering all available information. Flag any concerns about timing, amount, circumstances, or coverage applicability.`;

    return await callOpenRouter(systemPrompt, userPrompt, 0.3);
  } catch (error) {
    console.error('AI claim analysis failed:', error);
    return defaultResult;
  }
}

export async function analyzeDocument(document: {
  name: string;
  type: string;
  mimeType: string | null;
  description: string | null;
  fileSize: number | null;
}): Promise<DocumentAnalysisResult> {
  const defaultResult: DocumentAnalysisResult = {
    authenticityScore: 0.5,
    completenessScore: 0.5,
    relevanceScore: 0.5,
    keyDataPoints: [],
    flags: [],
    overallAssessment: 'AI analysis unavailable - manual review required.',
  };

  try {
    const systemPrompt = `You are an insurance document specialist with expertise in ACORD forms, policy declarations, certificates of insurance, loss runs, medical records, repair estimates, and claims documentation. You evaluate documents for authenticity, completeness, and relevance to the claim.

When analyzing documents, evaluate:
1. Document type identification and expected content for that type
2. Completeness - are all expected fields/sections present?
3. Authenticity indicators - formatting consistency, expected letterhead/branding, professional language
4. Relevance to the claim - does this document support or contradict the claim?
5. Data extraction - identify all key data points that should be recorded in the claim file
6. Red flags - inconsistencies, alterations, missing signatures, unusual formatting

Respond ONLY with valid JSON matching this schema:
{
  "authenticityScore": number 0-1 (1 = appears fully authentic),
  "completenessScore": number 0-1 (1 = all expected fields present),
  "relevanceScore": number 0-1 (1 = highly relevant to claim),
  "keyDataPoints": [{ "field": string, "value": string }],
  "flags": [string - any concerns or issues noted],
  "overallAssessment": string - detailed 1-2 paragraph assessment
}`;

    const userPrompt = `Analyze this insurance claim document:
- Document Name: ${document.name}
- Document Type: ${document.type}
- MIME Type: ${document.mimeType || 'Unknown'}
- Description: ${document.description || 'None provided'}
- File Size: ${document.fileSize ? `${(document.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}

Evaluate the document's authenticity, completeness, and relevance. Identify all key data points and flag any concerns.`;

    return await callOpenRouter(systemPrompt, userPrompt, 0.2);
  } catch (error) {
    console.error('AI document analysis failed:', error);
    return defaultResult;
  }
}

export async function detectFraud(claim: {
  type: string;
  description: string;
  estimatedLoss: number | null;
  dateOfLoss: string;
  dateReported: string;
  lossLocation: string | null;
  claimNumber: string;
  clientHistory?: { totalClaims: number; recentClaims: number };
}): Promise<FraudDetectionResult> {
  const defaultResult: FraudDetectionResult = {
    fraudRiskScore: 0.5,
    indicators: [],
    explanation: 'AI fraud detection unavailable - manual review required.',
    recommendation: 'Proceed with standard investigation.',
  };

  try {
    const systemPrompt = `You are an insurance Special Investigations Unit (SIU) analyst with expertise in fraud detection, pattern recognition, and claims investigation. You apply the NICB (National Insurance Crime Bureau) red flag indicators and industry-standard fraud scoring methodologies.

When evaluating for fraud, analyze these key indicators:
1. **Timing Red Flags**: New policy with early claim, claim near policy expiration/cancellation, loss on weekend/holiday, delayed reporting
2. **Financial Red Flags**: Round-number estimates, amount just below investigation threshold, financial stress indicators, inflated values
3. **Description Red Flags**: Vague or rehearsed narrative, inconsistencies in details, lack of witnesses, unusual loss circumstances
4. **History Red Flags**: Prior claims frequency, similar prior losses, multiple carriers, coverage shopping patterns
5. **Behavioral Red Flags**: Overly cooperative or aggressive, pushing for quick settlement, reluctance to provide documentation
6. **Pattern Red Flags**: Known fraud schemes (staged accidents, phantom damage, arson patterns), geographic fraud hotspots

Apply a scoring methodology:
- 0.0-0.3: Low fraud risk - proceed normally
- 0.3-0.5: Moderate risk - enhanced documentation, verify key facts
- 0.5-0.7: Elevated risk - detailed investigation recommended
- 0.7-0.9: High risk - SIU referral recommended
- 0.9-1.0: Very high risk - immediate SIU referral and claim hold

Respond ONLY with valid JSON matching this schema:
{
  "fraudRiskScore": number 0-1,
  "indicators": [{ "type": string, "severity": "LOW" | "MEDIUM" | "HIGH", "description": string }],
  "explanation": string - detailed 2-3 paragraph analysis of fraud risk,
  "recommendation": string - specific next steps based on the risk level
}`;

    const userPrompt = `Evaluate this insurance claim for potential fraud indicators:
- Claim #: ${claim.claimNumber}
- Claim Type: ${claim.type}
- Loss Description: ${claim.description}
- Date of Loss: ${claim.dateOfLoss}
- Date Reported: ${claim.dateReported}
- Reporting Delay: ${Math.round((new Date(claim.dateReported).getTime() - new Date(claim.dateOfLoss).getTime()) / (1000 * 60 * 60 * 24))} days
- Loss Location: ${claim.lossLocation || 'Not specified'}
- Estimated Loss Amount: ${claim.estimatedLoss ? `$${Number(claim.estimatedLoss).toLocaleString()}` : 'Not specified'}
- Client Claims History: ${claim.clientHistory ? `${claim.clientHistory.totalClaims} total claims on file, ${claim.clientHistory.recentClaims} claims in the last 12 months` : 'Unknown - unable to retrieve history'}

Perform a thorough fraud risk assessment using standard SIU indicators and scoring methodology.`;

    return await callOpenRouter(systemPrompt, userPrompt, 0.2);
  } catch (error) {
    console.error('AI fraud detection failed:', error);
    return defaultResult;
  }
}
