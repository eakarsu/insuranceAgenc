import prisma from './prisma';
import { evaluateUnderwriting } from './underwriting';

interface IssuanceResult {
  policy: any;
  commission: any;
  underwriting: any;
}

export async function bindAndIssuePolicy(quoteId: string, agentId: string): Promise<IssuanceResult> {
  // 1. Fetch quote with relations
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { client: true, carrier: true },
  });

  if (!quote) throw new Error('Quote not found');
  if (quote.status !== 'ACCEPTED') throw new Error('Quote must be in ACCEPTED status to bind');

  // 2. Run underwriting check
  const underwriting = await evaluateUnderwriting(quoteId);
  if (underwriting.decision === 'DECLINED') {
    throw new Error(`Underwriting declined: risk score ${underwriting.riskScore}/${underwriting.maxScore}`);
  }

  // 3. Generate policy number
  const year = new Date().getFullYear();
  const lastPolicy = await prisma.policy.findFirst({
    where: { policyNumber: { startsWith: `POL-${year}` } },
    orderBy: { policyNumber: 'desc' },
  });
  const lastNum = lastPolicy
    ? parseInt(lastPolicy.policyNumber.split('-')[2]) + 1
    : 1;
  const policyNumber = `POL-${year}-${String(lastNum).padStart(5, '0')}`;

  // 4. Calculate commission
  const premium = Number(quote.totalPremium || quote.premium || 0);
  let commissionRate = 10; // default 10%
  if (quote.carrier?.commissionRates) {
    const rates = quote.carrier.commissionRates as Record<string, number>;
    commissionRate = rates[quote.lineOfBusiness] || 10;
  }
  const commissionAmount = (premium * commissionRate) / 100;

  // 5. Expiration date: 1 year from effective date
  const expirationDate = new Date(quote.effectiveDate);
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);

  // 6. Atomic transaction: create policy + commission + update quote
  const result = await prisma.$transaction(async (tx) => {
    const policy = await tx.policy.create({
      data: {
        policyNumber,
        status: 'ACTIVE',
        lineOfBusiness: quote.lineOfBusiness,
        type: quote.type || `${quote.lineOfBusiness.replace(/_/g, ' ')} Policy`,
        effectiveDate: quote.effectiveDate,
        expirationDate,
        premium,
        clientId: quote.clientId,
        carrierId: quote.carrierId || '',
        agentId: agentId,
        quoteId: quote.id,
      },
      include: { client: true, carrier: true },
    });

    const commission = await tx.commission.create({
      data: {
        status: 'PENDING',
        type: 'NEW_BUSINESS',
        amount: commissionAmount,
        rate: commissionRate,
        basePremium: premium,
        earnedDate: new Date(),
        policyId: policy.id,
        agentId: agentId,
      },
    });

    await tx.quote.update({
      where: { id: quoteId },
      data: { status: 'BOUND' },
    });

    // Create activity log
    await tx.activity.create({
      data: {
        type: 'POLICY_CREATED',
        title: 'Policy issued from quote',
        description: `Policy ${policyNumber} issued from quote ${quote.quoteNumber}. Premium: $${premium.toLocaleString()}. Commission: $${commissionAmount.toFixed(2)}`,
        userId: agentId,
        clientId: quote.clientId,
        policyId: policy.id,
        quoteId: quote.id,
      },
    });

    return { policy, commission };
  });

  // 7. Auto-generate payment schedules based on installments
  const installmentCount = (quote as any).installments || 1;
  if (installmentCount > 1) {
    const installmentAmount = Math.round((premium / installmentCount) * 100) / 100;
    const schedules = [];
    for (let i = 0; i < installmentCount; i++) {
      const dueDate = new Date(quote.effectiveDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedules.push({
        policyId: result.policy.id,
        clientId: quote.clientId,
        amount: installmentAmount,
        dueDate,
        status: i === 0 ? 'SCHEDULED' : 'SCHEDULED',
      });
    }
    await prisma.paymentSchedule.createMany({ data: schedules });
  }

  return {
    policy: result.policy,
    commission: result.commission,
    underwriting,
  };
}

/**
 * Bind a renewal policy from a renewal quote.
 */
export async function bindRenewalPolicy(quoteId: string, agentId: string): Promise<IssuanceResult> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: { client: true, carrier: true },
  });

  if (!quote) throw new Error('Quote not found');
  if (!quote.isRenewal) throw new Error('Quote is not a renewal');
  if (!['ACCEPTED', 'QUOTED'].includes(quote.status)) throw new Error('Quote must be ACCEPTED or QUOTED');

  // Accept the quote first if needed
  if (quote.status === 'QUOTED') {
    await prisma.quote.update({ where: { id: quoteId }, data: { status: 'ACCEPTED' } });
  }

  // Use the standard bind flow
  return bindAndIssuePolicy(quoteId, agentId);
}
