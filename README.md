# InsureFlow governed claims

InsureFlow now has one production-shaped claim path: idempotent first notice of loss, policy-term snapshot, licensed adjuster assignment, digest-addressed evidence, reserve history, typed fraud screening, adjudication, independent appeal, payment authorization/reconciliation, subrogation recovery, and retained closure.

## Local verification

Use a dedicated PostgreSQL database whose name contains `_test` or `_validation` for tests.

```sh
npm ci
export DATABASE_URL=postgresql://localhost/insurance_agency_validation
export NEXTAUTH_SECRET=test-only-secret-with-more-than-thirty-two-characters
export CUSTOMER_JWT_SECRET=test-only-customer-secret-with-more-than-thirty-two-characters
export CLAIMS_EVIDENCE_ALLOWED_HOSTS=evidence.example.test
npx prisma generate
npx prisma migrate deploy
npm test
CORS_ALLOWED_ORIGIN=https://agency.example.test npm run build
```

Migrations and seed data are explicit operations. Normal startup never creates a database, mutates `.env`, applies schema changes, seeds sample data, kills processes, or falls back to simulated payouts.

## Governed API

- `POST /api/claims` requires an authenticated active user and an `Idempotency-Key` (or `externalEventId`) plus source, policy, claimant, loss, and jurisdiction data.
- `GET /api/claims/:id` returns the case, immutable evidence/history, financial ledger, appeals, recoveries, and integration outcomes.
- `POST /api/claims/:id/workflow` accepts an explicit action, `expectedVersion`, and idempotency key. Supported actions are `ASSIGN_ADJUSTER`, `ADD_EVIDENCE`, `SET_RESERVE`, `SUBMIT_FOR_REVIEW`, `ADJUDICATE`, `FILE_APPEAL`, `RESOLVE_APPEAL`, `AUTHORIZE_PAYMENT`, `RECORD_PAYMENT`, `OPEN_SUBROGATION`, `RECORD_RECOVERY`, and `CLOSE_CLAIM`.

Direct claim update/delete, bulk mutation, ungrounded claim AI, and legacy settlement payout routes fail closed. See [claims operations](docs/CLAIMS_OPERATIONS.md) for roles, attestations, adapters, recovery, and incident procedures.
