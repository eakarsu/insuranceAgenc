import prisma from './prisma';
import { LineOfBusiness } from '@prisma/client';

interface EvaluationContext {
  quote: any;
  client: any;
  claimsCount: number;
  policiesCount: number;
}

interface RuleFactor {
  ruleId: string;
  ruleName: string;
  riskPoints: number;
  detail: string;
}

export interface UnderwritingDecision {
  riskScore: number;
  maxScore: number;
  decision: 'APPROVED' | 'REFERRED' | 'DECLINED';
  factors: RuleFactor[];
}

function getFieldValue(context: EvaluationContext, field: string): any {
  const parts = field.split('.');
  let value: any = context;
  for (const part of parts) {
    if (value == null) return null;
    value = value[part];
  }
  return value;
}

function evaluateCondition(fieldValue: any, operator: string, ruleValue: string): boolean {
  if (fieldValue == null) return false;

  const numericField = Number(fieldValue);
  const numericRule = Number(ruleValue);

  switch (operator) {
    case 'GT':
      return numericField > numericRule;
    case 'LT':
      return numericField < numericRule;
    case 'GTE':
      return numericField >= numericRule;
    case 'LTE':
      return numericField <= numericRule;
    case 'EQ':
      return String(fieldValue) === ruleValue;
    case 'NEQ':
      return String(fieldValue) !== ruleValue;
    case 'BETWEEN': {
      try {
        const [min, max] = JSON.parse(ruleValue);
        return numericField >= Number(min) && numericField <= Number(max);
      } catch {
        return false;
      }
    }
    case 'IN': {
      try {
        const values = JSON.parse(ruleValue);
        return Array.isArray(values) && values.includes(String(fieldValue));
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

export async function evaluateUnderwriting(
  quoteId: string
): Promise<UnderwritingDecision> {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      client: true,
      policies: true,
    },
  });

  if (!quote) throw new Error('Quote not found');

  const claimsCount = await prisma.claim.count({
    where: { clientId: quote.clientId },
  });

  const policiesCount = await prisma.policy.count({
    where: { clientId: quote.clientId, status: 'ACTIVE' },
  });

  const rules = await prisma.underwritingRule.findMany({
    where: {
      lineOfBusiness: quote.lineOfBusiness,
      isActive: true,
    },
    orderBy: { priority: 'desc' },
  });

  const context: EvaluationContext = {
    quote,
    client: quote.client,
    claimsCount,
    policiesCount,
  };

  const factors: RuleFactor[] = [];
  let totalRiskPoints = 0;

  for (const rule of rules) {
    const fieldValue = getFieldValue(context, rule.field);
    const triggered = evaluateCondition(fieldValue, rule.operator, rule.value);

    if (triggered) {
      totalRiskPoints += rule.riskPoints;
      factors.push({
        ruleId: rule.id,
        ruleName: rule.name,
        riskPoints: rule.riskPoints,
        detail: `${rule.field} ${rule.operator} ${rule.value} (actual: ${fieldValue})`,
      });
    }
  }

  const maxScore = 100;
  const riskScore = Math.min(totalRiskPoints, maxScore);

  let decision: 'APPROVED' | 'REFERRED' | 'DECLINED';
  if (riskScore <= 30) {
    decision = 'APPROVED';
  } else if (riskScore <= 60) {
    decision = 'REFERRED';
  } else {
    decision = 'DECLINED';
  }

  // Save result
  const result = await prisma.underwritingResult.upsert({
    where: { quoteId },
    update: {
      riskScore,
      maxScore,
      decision,
      factors: factors as any,
    },
    create: {
      quoteId,
      riskScore,
      maxScore,
      decision,
      factors: factors as any,
    },
  });

  return { riskScore, maxScore, decision, factors };
}
