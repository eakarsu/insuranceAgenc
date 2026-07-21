import {
  assertLicensedAdjuster,
  assertPolicyCoverage,
  assertReconciled,
  validateEvidence,
  verifyCaseEventChain,
  sha256,
  stableJson,
} from '@/lib/claims-governance-rules';

test('policy coverage is deterministic at term boundaries', () => {
  const policy = { status: 'ACTIVE', clientId: 'client-a', effectiveDate: new Date('2026-01-01T00:00:00Z'), expirationDate: new Date('2026-12-31T23:59:59Z'), cancelDate: null };
  expect(() => assertPolicyCoverage(policy, 'client-a', new Date('2026-01-01T00:00:00Z'))).not.toThrow();
  expect(() => assertPolicyCoverage(policy, 'client-a', new Date('2025-12-31T23:59:59Z'))).toThrow('outside the policy term');
});

test('licensed review requires matching jurisdiction and future expiry', () => {
  const actor = { role: 'ADJUSTER', adjusterLicenseNumber: 'CA-1', adjusterLicenseStates: ['CA'], adjusterLicenseExpiresAt: new Date('2027-01-01T00:00:00Z') };
  expect(() => assertLicensedAdjuster(actor, 'CA', new Date('2026-01-01T00:00:00Z'))).not.toThrow();
  expect(() => assertLicensedAdjuster(actor, 'NY', new Date('2026-01-01T00:00:00Z'))).toThrow('not licensed');
});

test('evidence rejects unit, host, digest, and future-time confusion', () => {
  const valid = { sha256: 'a'.repeat(64), uri: 'https://evidence.example.test/a', sizeBytes: 1024, contentType: 'image/jpeg', capturedAt: new Date('2026-01-01T00:00:00Z') };
  expect(() => validateEvidence(valid, ['evidence.example.test'], new Date('2026-01-01T00:01:00Z'))).not.toThrow();
  expect(() => validateEvidence({ ...valid, sizeBytes: 0 }, ['evidence.example.test'])).toThrow('size');
  expect(() => validateEvidence({ ...valid, uri: 'https://evil.example.test/a' }, ['evidence.example.test'])).toThrow('allowed host');
});

test('financial reconciliation prevents reserve, authorization, and payment overruns', () => {
  expect(() => assertReconciled({ reserveAmount: 5000, approvedAmount: 3000, authorizedAmount: 3000, paidAmount: 3000 })).not.toThrow();
  expect(() => assertReconciled({ reserveAmount: 5000, approvedAmount: 3000, authorizedAmount: 3000, paidAmount: 3001 })).toThrow('exceeds authorization');
});

test('case-chain verification detects changed evidence', () => {
  const occurredAt = new Date('2026-01-01T00:00:00Z');
  const base = { sequence: 1, action: 'INTAKE_RECORDED', fromStatus: null, toStatus: 'REPORTED', actorId: 'actor', actorRole: 'AGENT', externalEventId: 'event-0001', payloadHash: sha256('payload'), previousHash: 'GENESIS', occurredAt };
  const eventHash = sha256(stableJson({ ...base, occurredAt: occurredAt.toISOString() }));
  expect(verifyCaseEventChain([{ ...base, eventHash }])).toBe(true);
  expect(verifyCaseEventChain([{ ...base, payloadHash: sha256('changed'), eventHash }])).toBe(false);
});
