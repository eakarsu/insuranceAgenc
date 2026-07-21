# Security policy

Report suspected vulnerabilities privately to the repository owner. Do not place policyholder data, credentials, evidence URLs, session tokens, payment references, or production logs in public issues.

Production requires unique 32-character-or-longer NextAuth, customer JWT, and integration secrets; HTTPS endpoints; an explicit CORS origin; and explicit evidence hosts. Rotate credentials after suspected disclosure. Customer tokens use issuer/audience checks and no fallback key. Internal claim routes reload the active user and role from PostgreSQL for each request.

Claim evidence is content-addressed, case and financial history is append-only, retained claims cannot be deleted, and adjudication/payment and original-decision/appeal review enforce separation of duties. Provider callbacks and operator actions must preserve their external event and transaction identifiers.
