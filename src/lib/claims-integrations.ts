import { getClaimsRuntimeConfig } from './claims-runtime-config';
import { ClaimGovernanceError } from './claims-governance-rules';

export interface FraudScreenResult {
  outcome: 'CLEAR' | 'REFER';
  riskCode: string;
  reference: string;
}

export interface PaymentAuthorizationResult {
  outcome: 'AUTHORIZED' | 'DECLINED';
  reference: string;
}

export interface ClaimIntegrations {
  screenFraud(input: {
    claimId: string;
    claimNumber: string;
    policyNumber: string;
    estimatedLoss: number;
    evidenceDigests: string[];
    idempotencyKey: string;
  }): Promise<FraudScreenResult>;
  authorizePayment(input: {
    claimId: string;
    claimNumber: string;
    amount: number;
    recipientReference: string;
    idempotencyKey: string;
  }): Promise<PaymentAuthorizationResult>;
}

async function postJson(url: URL, token: string, idempotencyKey: string, body: unknown): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new ClaimGovernanceError(502, 'INTEGRATION_FAILURE', `Claims integration returned HTTP ${response.status}`);
    }
    return response.json();
  } catch (error) {
    if (error instanceof ClaimGovernanceError) throw error;
    throw new ClaimGovernanceError(502, 'INTEGRATION_FAILURE', 'Claims integration was unavailable');
  } finally {
    clearTimeout(timeout);
  }
}

export function runtimeClaimIntegrations(): ClaimIntegrations {
  const config = getClaimsRuntimeConfig();
  return {
    async screenFraud(input) {
      const raw = await postJson(config.fraudEndpoint(), config.integrationToken(), input.idempotencyKey, input) as Record<string, unknown>;
      if (!['CLEAR', 'REFER'].includes(String(raw.outcome)) || typeof raw.riskCode !== 'string' || typeof raw.reference !== 'string') {
        throw new ClaimGovernanceError(502, 'INTEGRATION_RESPONSE_INVALID', 'Fraud service returned an invalid typed response');
      }
      return raw as unknown as FraudScreenResult;
    },
    async authorizePayment(input) {
      const raw = await postJson(config.paymentEndpoint(), config.integrationToken(), input.idempotencyKey, input) as Record<string, unknown>;
      if (!['AUTHORIZED', 'DECLINED'].includes(String(raw.outcome)) || typeof raw.reference !== 'string') {
        throw new ClaimGovernanceError(502, 'INTEGRATION_RESPONSE_INVALID', 'Payment service returned an invalid typed response');
      }
      return raw as unknown as PaymentAuthorizationResult;
    },
  };
}
