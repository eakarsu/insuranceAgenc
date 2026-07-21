import { createHash } from 'crypto';

export type ClaimWorkflowAction =
  | 'ASSIGN_ADJUSTER'
  | 'ADD_EVIDENCE'
  | 'SET_RESERVE'
  | 'SUBMIT_FOR_REVIEW'
  | 'ADJUDICATE'
  | 'FILE_APPEAL'
  | 'RESOLVE_APPEAL'
  | 'AUTHORIZE_PAYMENT'
  | 'RECORD_PAYMENT'
  | 'OPEN_SUBROGATION'
  | 'RECORD_RECOVERY'
  | 'CLOSE_CLAIM';

export class ClaimGovernanceError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    );
  }
  return value;
}

export function stableJson(value: unknown): string {
  return JSON.stringify(normalize(value));
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function assertRoles(role: string, allowed: string[]): void {
  if (!allowed.includes(role)) {
    throw new ClaimGovernanceError(403, 'FORBIDDEN', `Role ${role} cannot perform this claim action`);
  }
}

export function assertLicensedAdjuster(
  actor: {
    role: string;
    adjusterLicenseNumber?: string | null;
    adjusterLicenseStates?: string[];
    adjusterLicenseExpiresAt?: Date | null;
  },
  jurisdiction: string,
  now = new Date(),
): void {
  assertRoles(actor.role, ['ADJUSTER', 'MANAGER', 'ADMIN']);
  const state = jurisdiction.trim().toUpperCase();
  if (!actor.adjusterLicenseNumber) {
    throw new ClaimGovernanceError(422, 'ADJUSTER_LICENSE_REQUIRED', 'A recorded adjuster license is required');
  }
  if (!actor.adjusterLicenseStates?.map((item) => item.toUpperCase()).includes(state)) {
    throw new ClaimGovernanceError(422, 'ADJUSTER_JURISDICTION_MISMATCH', `Adjuster is not licensed in ${state}`);
  }
  if (!actor.adjusterLicenseExpiresAt || actor.adjusterLicenseExpiresAt.getTime() <= now.getTime()) {
    throw new ClaimGovernanceError(422, 'ADJUSTER_LICENSE_EXPIRED', 'Adjuster license is expired or has no expiry');
  }
}

const allowedStatuses: Record<ClaimWorkflowAction, string[]> = {
  ASSIGN_ADJUSTER: ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'REOPENED'],
  ADD_EVIDENCE: ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'IN_REVIEW', 'REOPENED'],
  SET_RESERVE: ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'IN_REVIEW', 'REOPENED', 'APPROVED'],
  SUBMIT_FOR_REVIEW: ['REPORTED', 'UNDER_INVESTIGATION', 'PENDING_DOCUMENTS', 'REOPENED'],
  ADJUDICATE: ['IN_REVIEW'],
  FILE_APPEAL: ['DENIED'],
  RESOLVE_APPEAL: ['REOPENED'],
  AUTHORIZE_PAYMENT: ['APPROVED'],
  RECORD_PAYMENT: ['APPROVED'],
  OPEN_SUBROGATION: ['APPROVED', 'SETTLED', 'CLOSED'],
  RECORD_RECOVERY: ['APPROVED', 'SETTLED', 'CLOSED'],
  CLOSE_CLAIM: ['DENIED', 'SETTLED'],
};

export function assertActionAllowed(status: string, action: ClaimWorkflowAction): void {
  if (!allowedStatuses[action]?.includes(status)) {
    throw new ClaimGovernanceError(409, 'INVALID_TRANSITION', `${action} is not allowed while claim is ${status}`);
  }
}

export function assertPolicyCoverage(
  policy: {
    status: string;
    clientId: string;
    effectiveDate: Date;
    expirationDate: Date;
    cancelDate?: Date | null;
  },
  clientId: string,
  dateOfLoss: Date,
): void {
  if (policy.clientId !== clientId) {
    throw new ClaimGovernanceError(422, 'POLICY_CLIENT_MISMATCH', 'Policy does not belong to the claimant');
  }
  if (policy.status !== 'ACTIVE') {
    throw new ClaimGovernanceError(422, 'POLICY_NOT_ACTIVE', 'Policy was not active at intake');
  }
  const loss = dateOfLoss.getTime();
  if (loss < policy.effectiveDate.getTime() || loss > policy.expirationDate.getTime()) {
    throw new ClaimGovernanceError(422, 'LOSS_OUTSIDE_POLICY_TERM', 'Date of loss is outside the policy term');
  }
  if (policy.cancelDate && loss >= policy.cancelDate.getTime()) {
    throw new ClaimGovernanceError(422, 'LOSS_AFTER_CANCELLATION', 'Date of loss is after policy cancellation');
  }
}

export function validateEvidence(input: {
  sha256: string;
  uri: string;
  sizeBytes: number;
  contentType: string;
  capturedAt: Date;
}, allowedHosts: string[], now = new Date()): void {
  if (!/^[a-f0-9]{64}$/i.test(input.sha256)) {
    throw new ClaimGovernanceError(422, 'INVALID_EVIDENCE_DIGEST', 'Evidence requires a SHA-256 digest');
  }
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > 100 * 1024 * 1024) {
    throw new ClaimGovernanceError(422, 'INVALID_EVIDENCE_SIZE', 'Evidence size must be between 1 byte and 100 MiB');
  }
  if (!/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(input.contentType)) {
    throw new ClaimGovernanceError(422, 'INVALID_CONTENT_TYPE', 'Evidence content type is invalid');
  }
  let url: URL;
  try {
    url = new URL(input.uri);
  } catch {
    throw new ClaimGovernanceError(422, 'INVALID_EVIDENCE_URI', 'Evidence URI is invalid');
  }
  if (url.protocol !== 'https:' || !allowedHosts.map((host) => host.toLowerCase()).includes(url.hostname.toLowerCase())) {
    throw new ClaimGovernanceError(422, 'UNTRUSTED_EVIDENCE_URI', 'Evidence must use HTTPS on an allowed host');
  }
  if (input.capturedAt.getTime() > now.getTime() + 5 * 60_000) {
    throw new ClaimGovernanceError(422, 'FUTURE_EVIDENCE', 'Evidence capture time is future-dated');
  }
}

export function assertReconciled(input: {
  reserveAmount: number;
  approvedAmount: number;
  authorizedAmount: number;
  paidAmount: number;
}): void {
  const values = Object.values(input);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new ClaimGovernanceError(422, 'INVALID_FINANCIAL_AMOUNT', 'Financial amounts must be finite and non-negative');
  }
  if (input.approvedAmount > input.reserveAmount) {
    throw new ClaimGovernanceError(422, 'APPROVAL_EXCEEDS_RESERVE', 'Approved amount exceeds the current reserve');
  }
  if (input.authorizedAmount > input.approvedAmount) {
    throw new ClaimGovernanceError(422, 'AUTHORIZATION_EXCEEDS_APPROVAL', 'Authorized payment exceeds adjudication');
  }
  if (input.paidAmount > input.authorizedAmount) {
    throw new ClaimGovernanceError(422, 'PAYMENT_EXCEEDS_AUTHORIZATION', 'Recorded payment exceeds authorization');
  }
}

export function verifyCaseEventChain(events: Array<{
  sequence: number;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  actorId: string;
  actorRole: string;
  externalEventId: string | null;
  payloadHash: string;
  previousHash: string;
  eventHash: string;
  occurredAt: Date;
}>): boolean {
  let previousHash = 'GENESIS';
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.sequence !== index + 1 || event.previousHash !== previousHash) return false;
    const expected = sha256(stableJson({
      sequence: event.sequence,
      action: event.action,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      actorId: event.actorId,
      actorRole: event.actorRole,
      externalEventId: event.externalEventId,
      payloadHash: event.payloadHash,
      previousHash: event.previousHash,
      occurredAt: event.occurredAt.toISOString(),
    }));
    if (expected !== event.eventHash) return false;
    previousHash = event.eventHash;
  }
  return true;
}
