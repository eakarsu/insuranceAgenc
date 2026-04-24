import prisma from './prisma';

export interface RatingInput {
  lineOfBusiness: string;
  riskInfo?: Record<string, any>;
  clientInfo?: {
    dateOfBirth?: string;
    state?: string;
    city?: string;
    claimsCount?: number;
    yearsAsClient?: number;
    creditScore?: number;
  };
  coverageOptions?: {
    deductible?: number;
    coverageLimit?: number;
  };
}

export interface RatingResult {
  baseRate: number;
  factors: {
    category: string;
    description: string;
    multiplier: number;
    flatAmount: number;
    impact: number;
  }[];
  subtotal: number;
  fees: number;
  taxes: number;
  totalPremium: number;
  rateTableId: string;
}

/**
 * Calculate premium for a given risk profile using rate tables and factors.
 */
export async function calculatePremium(input: RatingInput): Promise<RatingResult> {
  // 1. Find active rate table for this LOB
  const rateTable = await prisma.rateTable.findFirst({
    where: {
      lineOfBusiness: input.lineOfBusiness as any,
      isActive: true,
      effectiveDate: { lte: new Date() },
      OR: [
        { expirationDate: null },
        { expirationDate: { gte: new Date() } },
      ],
    },
    include: {
      factors: { orderBy: { priority: 'desc' } },
    },
    orderBy: { effectiveDate: 'desc' },
  });

  if (!rateTable) {
    // No rate table found — return a sensible default
    return {
      baseRate: 0,
      factors: [],
      subtotal: 0,
      fees: 0,
      taxes: 0,
      totalPremium: 0,
      rateTableId: '',
    };
  }

  const baseRate = Number(rateTable.baseRate);
  let premium = baseRate;
  const appliedFactors: RatingResult['factors'] = [];

  // 2. Apply matching rate factors
  for (const factor of rateTable.factors) {
    const condition = factor.condition as { operator: string; value: any; field?: string };
    const matches = evaluateCondition(factor.category, condition, input);

    if (matches) {
      const multiplier = Number(factor.multiplier);
      const flatAmount = Number(factor.flatAmount);
      const prevPremium = premium;

      premium = premium * multiplier + flatAmount;

      appliedFactors.push({
        category: factor.category,
        description: factor.description || `${factor.category} adjustment`,
        multiplier,
        flatAmount,
        impact: premium - prevPremium,
      });
    }
  }

  // 3. Calculate fees and taxes
  const fees = Math.round(premium * 0.03 * 100) / 100; // 3% fees
  const taxes = Math.round(premium * 0.02 * 100) / 100; // 2% taxes
  const totalPremium = Math.round((premium + fees + taxes) * 100) / 100;

  return {
    baseRate,
    factors: appliedFactors,
    subtotal: Math.round(premium * 100) / 100,
    fees,
    taxes,
    totalPremium,
    rateTableId: rateTable.id,
  };
}

function evaluateCondition(
  category: string,
  condition: { operator: string; value: any; field?: string },
  input: RatingInput
): boolean {
  const { operator, value } = condition;
  let actual: any;

  // Map category to input values
  switch (category) {
    case 'AGE': {
      if (!input.clientInfo?.dateOfBirth) return false;
      const dob = new Date(input.clientInfo.dateOfBirth);
      actual = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      break;
    }
    case 'LOCATION':
      actual = input.clientInfo?.state || '';
      break;
    case 'CLAIMS_HISTORY':
      actual = input.clientInfo?.claimsCount ?? (input.riskInfo?.claims ?? 0);
      break;
    case 'DEDUCTIBLE':
      actual = input.coverageOptions?.deductible ?? (input.riskInfo?.deductible ?? 500);
      break;
    case 'COVERAGE_LIMIT':
      actual = input.coverageOptions?.coverageLimit ?? (input.riskInfo?.coverageLimit ?? 100000);
      break;
    case 'VEHICLE_AGE':
      actual = input.riskInfo?.vehicleAge ?? 5;
      break;
    case 'PROPERTY_VALUE':
      actual = input.riskInfo?.propertyValue ?? 0;
      break;
    case 'LOYALTY':
      actual = input.clientInfo?.yearsAsClient ?? 0;
      break;
    case 'CREDIT_SCORE':
      actual = input.clientInfo?.creditScore ?? 700;
      break;
    default:
      return false;
  }

  // Evaluate operator
  switch (operator) {
    case 'GT': return actual > Number(value);
    case 'GTE': return actual >= Number(value);
    case 'LT': return actual < Number(value);
    case 'LTE': return actual <= Number(value);
    case 'EQ': return String(actual) === String(value);
    case 'NEQ': return String(actual) !== String(value);
    case 'IN': return Array.isArray(value) ? value.includes(actual) : String(value).split(',').includes(String(actual));
    case 'BETWEEN': {
      const [min, max] = Array.isArray(value) ? value : [0, 0];
      return actual >= Number(min) && actual <= Number(max);
    }
    default: return false;
  }
}
