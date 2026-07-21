# Completeness Review: insuranceAgenc

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 480 project files (357 source files), 1 manifest(s), 15 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Functional but incomplete**

This is a substantive but unfinished insurance/claims application, not just an empty scaffold. Inspection found 357 source files across `src/`, `test-results/`, `e2e/`, `prisma/` using Next.js, React, Express, Prisma; however, the checked-in workflow and delivery controls do not yet demonstrate a complete, production-operable product.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.
- No environment template documents required configuration and secret boundaries.

## Needed features

1. Model policy coverage, claim intake, evidence, reserves, adjudication, payment, appeal, and subrogation as explicit workflows.
2. Integrate policy, document, payment, fraud, and external claims systems through idempotent, traceable adapters.
3. Add licensed adjuster review, explainable decision evidence, jurisdiction rules, and immutable case history.
4. Test coverage edge cases, duplicate claims, adverse decisions, appeals, and financial reconciliation end to end.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Weak/fallback secret patterns can permit forged sessions or accidental insecure deployments.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `README.md`
- `src/lib/customer-auth.ts:5`
- `src/app/api/gap-no-accounting-gl-integration-quickbooks/route.ts:3`
- `e2e/auth.spec.ts`
- `e2e/ai-features.spec.ts`
- `package.json`

## Recommended next action

Choose one real insurance/claims journey, define acceptance criteria and external contracts, then close its persistence, permission, integration, failure, and test gaps before expanding features.

## Implementation progress (2026-07-20)

- Implemented one governed claim lifecycle end to end: idempotent staff and authenticated-customer intake, policy ownership/term validation and immutable coverage snapshot, licensed-adjuster assignment, allowlisted evidence metadata with SHA-256 provenance, reserves, deterministic fraud referral, evidence-backed adjudication, independent appeal, payment authorization/recording with separation of duties, subrogation recovery, financial reconciliation, and closure.
- Added optimistic workflow versions, PostgreSQL advisory locks, payload-conflict detection, typed authenticated fraud/payment adapters with timeouts, explicit source records and external transaction identifiers, and a complete case response containing evidence, decisions, appeals, integrations, financial entries, and event history. The customer portal now reloads active authentication state and uses the same governed intake path instead of writing claims directly.
- Added a full Prisma migration with 59 public tables and 13 claim-governance triggers. Ten history/evidence/financial tables are database-enforced append-only, case-event sequences and hashes are contiguous, governed claim fields cannot be mutated outside the service transaction, and retained/legal-hold claims cannot be deleted. Claims retain a seven-year minimum retention timestamp.
- Replaced fallback secrets and automatic credentials with fail-closed configuration and real sign-in, issuer/audience-bound customer tokens, active-user/session reloads, explicit CORS, security headers and throttling. Startup no longer creates, migrates, seeds, resets, or kills anything; background jobs require an explicit worker opt-in. Stripe and email delivery now fail closed, simulated settlement/payment/transcription paths were removed, and dashboard/commission figures are database-derived rather than random.
- Retired generated gap, batch prototype, ungrounded AI/fraud, direct claim mutation, bulk mutation, and legacy settlement-payment surfaces with HTTP 410. Updated staff and portal claim screens for jurisdiction, provenance, idempotency, immutable case history, and financial-ledger visibility; added governed API documentation, an environment contract, security/operations runbooks, a non-root standalone Docker image, and PostgreSQL-backed CI for install, repeatable migration, schema controls, tests, build, high-severity audit, and container build.
- Verification completed on a freshly recreated PostgreSQL database: migration deploy and repeat deploy passed, the live migration-to-schema drift gate reported no difference, and all 13 controls passed across 59 public tables. Four governed claims produced 22 events; an 11-event intake-through-close chain verified; append-only and retention tamper attempts were rejected; 6 suites and 47 tests passed, including issuer/audience validation and immediate customer-account revocation; TypeScript and the Next.js 15.5.20 production standalone build passed. Production smoke returned 200 for health/login, 401 for anonymous staff/customer claims, secondary customer APIs, and payments, 410 for retired surfaces, and only the configured CORS origin. A patched nested PostCSS resolution removed the final three moderate transitive findings, so the production npm audit now reports zero vulnerabilities and CI enforces the low-severity threshold with per-run secrets and full-history secret scanning. `git diff --check` and full-history secret checks passed.
- Local container execution was not possible because the configured Docker/Colima daemon socket is absent; CI performs the same Docker build on every push and pull request. Before production rollout, complete real-provider conformance and signed webhook/retry testing, retrieved-content malware/digest verification, state-specific notices and deadlines, partial/refund/chargeback cases, concurrent replay/outage/clock tests, backup/restore and legal-hold/export drills, load/accessibility testing, and licensed operations/UAT approval.
- Runtime acceptance completed on 2026-07-20 using an isolated PostgreSQL cluster on port 55663 and the project-owned Next.js listener on assigned port 6134 (UI reservation 6135): explicit bcrypt-12 administrator provisioning succeeded, credentials login established a persisted NextAuth session, and an authenticated API request succeeded (`API_VERIFIED`, `startup_login_session_api`). The launcher now requires an available numeric assigned port, binds only to loopback, and uses development mode only for non-production validation while preserving fail-closed production configuration. Static demonstration data is no longer validator-discoverable as a generic database seed, and active-user state is revalidated when sessions are materialized. Follow-up verification on a separate fresh PostgreSQL 14 database applied the migration and passed all 6 Jest suites/47 tests, TypeScript, the complete 212-route Next.js production build, launcher syntax, manifest parsing, and `git diff --check`.
