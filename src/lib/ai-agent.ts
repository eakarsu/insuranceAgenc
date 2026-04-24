import prisma from './prisma';

// ============================================================
// AI Agent Core — builds context from customer data and
// generates natural-language responses via any LLM provider.
//
// Supports: Anthropic (Claude), OpenAI, or a built-in fallback
// that works without any API key for development/demo.
// ============================================================

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ----- types -----

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CustomerContext {
  client: any;
  policies: any[];
  claims: any[];
  payments: any[];
  quotes: any[];
}

export interface AIResponse {
  message: string;
  suggestedActions?: { label: string; action: string }[];
}

// ----- context builders -----

export async function buildCustomerContext(clientId: string): Promise<CustomerContext> {
  const [client, policies, claims, payments, quotes] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true, firstName: true, lastName: true, type: true, status: true,
        email: true, phone: true, city: true, state: true,
        businessName: true, businessType: true,
      },
    }),
    prisma.policy.findMany({
      where: { clientId },
      include: { carrier: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.claim.findMany({
      where: { clientId },
      include: { policy: { select: { policyNumber: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.payment.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.quote.findMany({
      where: { clientId },
      include: { proposal: { select: { signedAt: true, sentAt: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  return { client, policies, claims, payments, quotes };
}

function contextToText(ctx: CustomerContext): string {
  const c = ctx.client;
  if (!c) return 'No customer data available.';

  const lines: string[] = [
    `CUSTOMER: ${c.firstName} ${c.lastName} (${c.type})`,
    `Status: ${c.status} | Location: ${c.city || ''}, ${c.state || ''}`,
    c.businessName ? `Business: ${c.businessName} (${c.businessType})` : '',
    '',
    `POLICIES (${ctx.policies.length}):`,
    ...ctx.policies.map((p) =>
      `  - ${p.policyNumber} | ${p.lineOfBusiness.replace(/_/g, ' ')} | ${p.carrier?.name || 'N/A'} | $${Number(p.premium).toLocaleString()} | Status: ${p.status} | Expires: ${p.expirationDate ? new Date(p.expirationDate).toLocaleDateString() : 'N/A'}`
    ),
    '',
    `CLAIMS (${ctx.claims.length}):`,
    ...ctx.claims.map((cl) =>
      `  - ${cl.claimNumber} | ${cl.type} | Policy: ${cl.policy?.policyNumber || 'N/A'} | Est. Loss: $${Number(cl.estimatedLoss || 0).toLocaleString()} | Status: ${cl.status} | Filed: ${new Date(cl.dateOfLoss).toLocaleDateString()}`
    ),
    '',
    `PAYMENTS (${ctx.payments.length}):`,
    ...ctx.payments.map((pay) =>
      `  - $${Number(pay.amount).toLocaleString()} | Status: ${pay.status} | ${pay.paidAt ? `Paid: ${new Date(pay.paidAt).toLocaleDateString()}` : 'Not yet paid'}`
    ),
    '',
    `QUOTES (${ctx.quotes.length}):`,
    ...ctx.quotes.map((q) =>
      `  - ${q.quoteNumber} | ${q.lineOfBusiness.replace(/_/g, ' ')} | $${Number(q.totalPremium || 0).toLocaleString()} | Status: ${q.status}${q.proposal?.signedAt ? ' | SIGNED' : ''}`
    ),
  ];

  return lines.filter(Boolean).join('\n');
}

// ----- system prompts -----

const CUSTOMER_CHAT_SYSTEM = `You are the AI customer service agent for InsureFlow Insurance Company. You speak naturally, with empathy and clarity.

RULES:
- Be warm, professional, and helpful. Use the customer's first name.
- Answer questions about their policies, claims, payments, and coverage using the CUSTOMER DATA provided.
- If a claim was denied, explain the reason clearly and kindly, and suggest next steps (appeal, provide documentation, etc.).
- If the customer wants to file a claim, guide them step by step and tell them they can do it from the Claims page.
- If the customer has a payment question, explain the status clearly.
- For coverage questions, explain what their policy covers in simple terms.
- Never make up information. If something is not in the data, say you'll look into it.
- If the question is beyond your ability (legal advice, complex disputes), say you'll connect them with a specialist.
- Keep responses concise — 2-4 sentences for simple questions, more for complex ones.
- Suggest relevant actions when appropriate (e.g., "You can file a claim from the Claims page").
- NEVER reveal internal system details, database IDs, or technical information.`;

const CLAIMS_REVIEW_SYSTEM = `You are an AI claims adjuster for InsureFlow Insurance Company. You review insurance claims and provide decisions with clear, empathetic explanations.

For each claim, you will receive the claim details, policy information, and client history. You must:

1. DECISION: Provide one of: APPROVE, INVESTIGATE, DENY
2. REASONING: Explain your reasoning in 2-3 sentences
3. CUSTOMER_EXPLANATION: Write a kind, clear explanation for the customer (3-5 sentences). If denying, explain why clearly and suggest alternatives.
4. RISK_FLAGS: List any red flags (0-3)
5. RECOMMENDED_RESERVE: Suggest a reserve amount
6. CONFIDENCE: Your confidence level (HIGH, MEDIUM, LOW)

Respond ONLY in valid JSON with these exact keys.

Guidelines:
- Approve straightforward claims with clear documentation
- Investigate claims with inconsistencies or high amounts
- Deny only when the claim clearly falls outside coverage
- Always be fair — when in doubt, investigate rather than deny
- Consider the customer's history (long-term loyal customers deserve benefit of the doubt)`;

const COVERAGE_ADVISOR_SYSTEM = `You are an AI coverage advisor for InsureFlow Insurance Company. You analyze a client's profile and current coverage to recommend additional products.

For each client, provide:
1. COVERAGE_GAPS: List gaps in their current coverage (1-5 items)
2. RECOMMENDATIONS: For each gap, recommend a specific product with estimated premium range
3. PRIORITY: Rank recommendations by urgency (HIGH, MEDIUM, LOW)
4. EXPLANATION: Write a friendly, jargon-free explanation for the customer (3-5 sentences per recommendation)
5. OVERALL_SCORE: Rate their current coverage adequacy (1-10)

Respond ONLY in valid JSON with these exact keys.

Be practical — don't over-sell. Only recommend what genuinely protects the client.`;

// ----- LLM call -----

async function callLLM(
  systemPrompt: string,
  userMessage: string,
  history: ChatMessage[] = []
): Promise<string> {
  // Try Anthropic first
  if (ANTHROPIC_API_KEY && ANTHROPIC_API_KEY !== '') {
    try {
      const messages = [
        ...history.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userMessage },
      ];

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.content?.[0]?.text || '';
      }
    } catch (e) {
      console.error('Anthropic API error:', e);
    }
  }

  // Try OpenAI
  if (OPENAI_API_KEY && OPENAI_API_KEY !== '') {
    try {
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        { role: 'user' as const, content: userMessage },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1024,
          messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (e) {
      console.error('OpenAI API error:', e);
    }
  }

  // Fallback: smart built-in responses (no API key needed)
  return generateFallbackResponse(userMessage);
}

// ----- fallback (works without any API key) -----

function generateFallbackResponse(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('claim') && (lower.includes('file') || lower.includes('new') || lower.includes('submit'))) {
    return "I'd be happy to help you file a claim! You can do this directly from the **Claims** page in your portal. Click \"File New Claim\", select the policy, describe what happened, and we'll get it processed right away. If you need help during the process, I'm right here.";
  }
  if (lower.includes('claim') && (lower.includes('status') || lower.includes('update') || lower.includes('where'))) {
    return "You can check the status of all your claims on the **Claims** page. Each claim shows its current status — from Reported through Investigation to Settlement. If a claim has been under review for a while, don't worry — complex claims sometimes take time to ensure we get you the best outcome.";
  }
  if (lower.includes('claim') && (lower.includes('denied') || lower.includes('reject'))) {
    return "I'm sorry to hear about the denial. Claims can be denied for various reasons — usually related to policy exclusions or documentation gaps. I recommend checking the denial letter for specific reasons, and you can always appeal by providing additional documentation. Would you like me to guide you through the appeals process?";
  }
  if (lower.includes('pay') || lower.includes('bill') || lower.includes('premium')) {
    return "You can view all your payments and make new payments from the **Payments** page. If you have an outstanding balance, you'll see a \"Pay Now\" option. We accept all major credit cards through our secure payment system. If you're having trouble with a payment, let me know the details and I'll help sort it out.";
  }
  if (lower.includes('policy') && (lower.includes('what') || lower.includes('cover') || lower.includes('explain'))) {
    return "Great question! Your policy details, including coverage limits, deductibles, and what's covered, are all on the **Policies** page. Each policy shows a full breakdown. In general, your coverage protects you against covered losses up to your policy limits, minus your deductible. Want me to explain a specific part of your coverage?";
  }
  if (lower.includes('policy') && (lower.includes('cancel') || lower.includes('change'))) {
    return "If you need to make changes to your policy or cancel, I'd recommend reaching out so we can discuss your options first. Sometimes there are better alternatives — like adjusting coverage levels or deductibles — that might work better for you. What changes are you considering?";
  }
  if (lower.includes('quote') || lower.includes('new policy') || lower.includes('add coverage')) {
    return "I'd love to help you explore additional coverage! You can view your current quotes on the **Quotes** page. If you're looking for new coverage, I can help you understand what options are available based on your profile. What type of coverage are you interested in?";
  }
  if (lower.includes('document') || lower.includes('proof') || lower.includes('certificate')) {
    return "All your insurance documents are available on the **Documents** page. You can download policy declarations, ID cards, and certificates of insurance anytime. If you need a specific document that isn't there, let me know and I'll help get it for you.";
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('good')) {
    return "Hello! Welcome to InsureFlow. I'm your AI insurance assistant, and I'm here to help with anything — policies, claims, payments, coverage questions, or anything else. What can I help you with today?";
  }
  if (lower.includes('thank')) {
    return "You're welcome! I'm always here if you need anything else. Have a great day! 😊";
  }

  return "I'm here to help with all your insurance needs! I can assist with:\n\n- **Policies** — View coverage details, make changes\n- **Claims** — File new claims, check status\n- **Payments** — Make payments, view history\n- **Documents** — Download policy documents\n- **Coverage** — Understand what's covered\n\nWhat would you like to know about?";
}

// ----- public API -----

export async function customerChat(
  clientId: string,
  message: string,
  history: ChatMessage[] = []
): Promise<AIResponse> {
  const ctx = await buildCustomerContext(clientId);
  const contextText = contextToText(ctx);

  const userMessage = `CUSTOMER DATA:\n${contextText}\n\nCUSTOMER MESSAGE:\n${message}`;

  const response = await callLLM(CUSTOMER_CHAT_SYSTEM, userMessage, history);

  // Extract suggested actions from response
  const suggestedActions: { label: string; action: string }[] = [];
  if (response.toLowerCase().includes('claim')) {
    suggestedActions.push({ label: 'Go to Claims', action: '/portal/claims' });
  }
  if (response.toLowerCase().includes('payment')) {
    suggestedActions.push({ label: 'Go to Payments', action: '/portal/payments' });
  }
  if (response.toLowerCase().includes('polic')) {
    suggestedActions.push({ label: 'View Policies', action: '/portal/policies' });
  }
  if (response.toLowerCase().includes('document')) {
    suggestedActions.push({ label: 'View Documents', action: '/portal/documents' });
  }

  return { message: response, suggestedActions };
}

export async function reviewClaim(claimId: string): Promise<any> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      policy: { include: { carrier: true, client: true } },
      client: true,
      communications: { take: 5, orderBy: { createdAt: 'desc' } },
      settlements: true,
      documents: true,
    },
  });

  if (!claim) throw new Error('Claim not found');

  // Get client's claims history
  const claimsHistory = await prisma.claim.count({
    where: { clientId: claim.clientId },
  });

  const clientTenure = claim.client?.createdAt
    ? Math.floor((Date.now() - new Date(claim.client.createdAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  const userMessage = `CLAIM TO REVIEW:
Claim #: ${claim.claimNumber}
Type: ${claim.type}
Status: ${claim.status}
Date of Loss: ${new Date(claim.dateOfLoss).toLocaleDateString()}
Description: ${claim.description}
Location: ${claim.lossLocation || 'Not specified'}
Estimated Loss: $${Number(claim.estimatedLoss || 0).toLocaleString()}
Deductible: $${Number(claim.deductible || 0).toLocaleString()}

POLICY:
Policy #: ${claim.policy?.policyNumber}
Type: ${claim.policy?.lineOfBusiness?.replace(/_/g, ' ')}
Carrier: ${claim.policy?.carrier?.name}
Premium: $${Number(claim.policy?.premium || 0).toLocaleString()}
Status: ${claim.policy?.status}

CLIENT:
Name: ${claim.client?.firstName} ${claim.client?.lastName}
Type: ${claim.client?.type}
Status: ${claim.client?.status}
Client for: ${clientTenure} years
Total prior claims: ${claimsHistory}
Documents attached: ${claim.documents?.length || 0}

Provide your review decision as JSON.`;

  const response = await callLLM(CLAIMS_REVIEW_SYSTEM, userMessage);

  // Try to parse JSON response
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // If LLM didn't return valid JSON, construct a structured response
  }

  // Fallback structured response
  const estimatedLoss = Number(claim.estimatedLoss || 0);
  const isHighValue = estimatedLoss > 10000;
  const hasHistory = claimsHistory > 3;
  const isNewClient = clientTenure < 1;

  let decision = 'APPROVE';
  let confidence = 'HIGH';
  const riskFlags: string[] = [];

  if (isHighValue) { riskFlags.push('High claim amount'); confidence = 'MEDIUM'; }
  if (hasHistory) { riskFlags.push('Multiple prior claims'); decision = 'INVESTIGATE'; confidence = 'MEDIUM'; }
  if (isNewClient) { riskFlags.push('New client — limited history'); }
  if (isHighValue && hasHistory) { decision = 'INVESTIGATE'; confidence = 'LOW'; }

  // Auto-escalate INVESTIGATE decisions and LOW confidence
  if (decision === 'INVESTIGATE' || confidence === 'LOW') {
    try {
      const { createEscalation } = await import('./escalation-service');
      await createEscalation({
        type: 'CLAIM',
        priority: confidence === 'LOW' ? 'HIGH' : 'MEDIUM',
        title: `Claim Review: ${claim.claimNumber} — ${decision}`,
        description: `AI claims review returned ${decision} with ${confidence} confidence. ${riskFlags.length > 0 ? `Risk flags: ${riskFlags.join(', ')}` : 'No flags.'}. Estimated loss: $${estimatedLoss.toLocaleString()}`,
        entityType: 'CLAIM',
        entityId: claimId,
      });
    } catch (e) {
      console.warn('Failed to create escalation:', e);
    }
  }

  return {
    DECISION: decision,
    REASONING: `Claim for ${claim.type} with estimated loss of $${estimatedLoss.toLocaleString()}. Client has ${claimsHistory} prior claims over ${clientTenure} years. ${riskFlags.length > 0 ? `Risk factors: ${riskFlags.join(', ')}.` : 'No significant risk factors identified.'}`,
    CUSTOMER_EXPLANATION: decision === 'APPROVE'
      ? `Great news, ${claim.client?.firstName}! We've reviewed your ${claim.type.toLowerCase()} claim and everything looks good. We'll process your claim for the estimated amount of $${estimatedLoss.toLocaleString()} minus your $${Number(claim.deductible || 0).toLocaleString()} deductible. You should receive an update within 3-5 business days.`
      : decision === 'INVESTIGATE'
      ? `Hi ${claim.client?.firstName}, thank you for filing your claim. Given the nature of this ${claim.type.toLowerCase()} claim, we need to gather a bit more information before we can finalize our decision. This is standard procedure and nothing to worry about. An adjuster will reach out to you within 2 business days to discuss the details.`
      : `Hi ${claim.client?.firstName}, after careful review of your ${claim.type.toLowerCase()} claim, we unfortunately cannot approve it under your current policy coverage. This is typically because the type of loss falls outside your policy's covered perils. We recommend reviewing your policy details and reaching out if you'd like to discuss options or file an appeal.`,
    RISK_FLAGS: riskFlags,
    RECOMMENDED_RESERVE: Math.round(estimatedLoss * 1.1),
    CONFIDENCE: confidence,
  };
}

export async function adviseCoverage(clientId: string): Promise<any> {
  const ctx = await buildCustomerContext(clientId);
  const contextText = contextToText(ctx);

  const userMessage = `CLIENT PROFILE AND CURRENT COVERAGE:\n${contextText}\n\nAnalyze this client's coverage and provide recommendations as JSON.`;

  const response = await callLLM(COVERAGE_ADVISOR_SYSTEM, userMessage);

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // fallback below
  }

  // Fallback structured response
  const hasHome = ctx.policies.some((p) => p.lineOfBusiness === 'HOMEOWNERS');
  const hasAuto = ctx.policies.some((p) => p.lineOfBusiness === 'PERSONAL_AUTO');
  const hasUmbrella = ctx.policies.some((p) => p.lineOfBusiness === 'UMBRELLA');
  const hasLife = ctx.policies.some((p) => p.lineOfBusiness === 'LIFE');
  const isCommercial = ctx.client?.type === 'COMMERCIAL';
  const hasCyber = ctx.policies.some((p) => p.lineOfBusiness === 'CYBER');

  const gaps: any[] = [];
  const recommendations: any[] = [];

  if (hasHome && hasAuto && !hasUmbrella) {
    gaps.push('No umbrella/excess liability coverage');
    recommendations.push({
      product: 'Umbrella Policy',
      priority: 'HIGH',
      estimatedPremium: '$200-$500/year',
      explanation: `${ctx.client?.firstName}, since you have both home and auto coverage, an umbrella policy is a smart addition. It provides an extra $1M+ of liability protection above your existing policies — protecting your assets if something major happens. It's one of the best values in insurance.`,
    });
  }
  if (!hasLife && ctx.client?.type === 'PERSONAL') {
    gaps.push('No life insurance coverage');
    recommendations.push({
      product: 'Term Life Insurance',
      priority: 'MEDIUM',
      estimatedPremium: '$30-$100/month',
      explanation: `Life insurance ensures your family is financially protected. A 20-year term policy is affordable and provides peace of mind. The younger and healthier you are, the lower the premiums.`,
    });
  }
  if (isCommercial && !hasCyber) {
    gaps.push('No cyber liability coverage');
    recommendations.push({
      product: 'Cyber Liability Insurance',
      priority: 'HIGH',
      estimatedPremium: '$1,000-$5,000/year',
      explanation: `As a business, you handle sensitive data. Cyber insurance protects against data breaches, ransomware, and business interruption from cyber attacks. Given the rising threat landscape, this is essential coverage.`,
    });
  }
  if (ctx.policies.length === 0) {
    gaps.push('No active coverage at all');
    recommendations.push({
      product: 'Basic Coverage Package',
      priority: 'HIGH',
      estimatedPremium: 'Varies',
      explanation: `${ctx.client?.firstName}, it looks like you don't have any active policies. Let's start with the basics — auto insurance if you drive, and renters or homeowners insurance to protect your belongings.`,
    });
  }

  const score = Math.min(10, Math.max(1, 10 - gaps.length * 2));

  return {
    COVERAGE_GAPS: gaps.length > 0 ? gaps : ['Your coverage looks comprehensive!'],
    RECOMMENDATIONS: recommendations,
    OVERALL_SCORE: score,
  };
}
