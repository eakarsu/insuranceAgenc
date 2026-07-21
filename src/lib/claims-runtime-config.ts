import { ClaimGovernanceError } from './claims-governance-rules';

const weakSecret = /^(secret|changeme|change-me|development|dev|password|nextauth_secret)$/i;

export function requiredSecret(name: string): string {
  const value = String(process.env[name] || '');
  if (value.length < 32 || weakSecret.test(value)) {
    throw new Error(`${name} must be a non-placeholder value of at least 32 characters`);
  }
  return value;
}

function allowlist(name: string): string[] {
  const values = String(process.env[name] || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  if (!values.length || values.includes('*')) throw new Error(`${name} requires an explicit allowlist`);
  return values;
}

function integrationEndpoint(name: string): URL {
  const value = String(process.env[name] || '');
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new ClaimGovernanceError(503, 'INTEGRATION_NOT_CONFIGURED', `${name} is not configured`);
  }
  if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    throw new Error(`${name} must use HTTPS in production`);
  }
  return url;
}

export function getClaimsRuntimeConfig() {
  requiredSecret('NEXTAUTH_SECRET');
  return {
    evidenceHosts: allowlist('CLAIMS_EVIDENCE_ALLOWED_HOSTS'),
    fraudEndpoint: () => integrationEndpoint('CLAIMS_FRAUD_ENDPOINT'),
    paymentEndpoint: () => integrationEndpoint('CLAIMS_PAYMENT_ENDPOINT'),
    integrationToken: () => requiredSecret('CLAIMS_INTEGRATION_TOKEN'),
  };
}
