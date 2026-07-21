#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"

psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE missing text;
BEGIN
  SELECT string_agg(required.name, ', ') INTO missing
  FROM (VALUES
    ('ClaimCaseEvent_immutable'), ('ClaimEvidence_immutable'), ('ClaimReserveEntry_immutable'),
    ('ClaimAdjudication_immutable'), ('ClaimAppeal_immutable'), ('ClaimAppealDecision_immutable'),
    ('ClaimSubrogation_immutable'), ('ClaimRecoveryEntry_immutable'), ('ClaimFinancialEntry_immutable'),
    ('ClaimIntegrationEvent_immutable'), ('ClaimCaseEvent_chain'), ('Claim_governed_update'), ('Claim_retained')
  ) required(name)
  LEFT JOIN pg_trigger trigger ON trigger.tgname = required.name AND NOT trigger.tgisinternal
  WHERE trigger.oid IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'missing governed claim triggers: %', missing; END IF;
  IF NOT EXISTS (SELECT 1 FROM "_prisma_migrations" WHERE migration_name='20260720075650_governed_claim_lifecycle' AND finished_at IS NOT NULL) THEN
    RAISE EXCEPTION 'governed claim migration is not recorded as complete';
  END IF;
END $$;
SQL
echo "governed claim schema controls verified"
