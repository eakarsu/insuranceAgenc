#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_dir="${RUNTIME_PROJECT_SOURCE:-$project_dir}"
runtime_port="${PORT:-${BACKEND_PORT:-}}"
[[ "$runtime_port" =~ ^[0-9]+$ ]] || { echo "PORT or BACKEND_PORT must be an assigned numeric port" >&2; exit 2; }
if lsof -tiTCP:"$runtime_port" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Assigned port $runtime_port is already in use; no process was stopped" >&2
  exit 1
fi

if [[ "${NODE_ENV:-development}" != production ]]; then
  export CUSTOMER_JWT_SECRET="${CUSTOMER_JWT_SECRET:-${REFRESH_TOKEN_SECRET:-}}"
  export CLAIMS_EVIDENCE_ALLOWED_HOSTS="${CLAIMS_EVIDENCE_ALLOWED_HOSTS:-evidence.example.test}"
  export CLAIMS_FRAUD_ENDPOINT="${CLAIMS_FRAUD_ENDPOINT:-https://fraud.example.test/v1/claims/screen}"
  export CLAIMS_PAYMENT_ENDPOINT="${CLAIMS_PAYMENT_ENDPOINT:-https://payments.example.test/v1/claims/authorize}"
  export CLAIMS_INTEGRATION_TOKEN="${CLAIMS_INTEGRATION_TOKEN:-${SECRET_KEY:-}}"
fi

for name in DATABASE_URL NEXTAUTH_URL NEXTAUTH_SECRET CUSTOMER_JWT_SECRET CLAIMS_EVIDENCE_ALLOWED_HOSTS CLAIMS_FRAUD_ENDPOINT CLAIMS_PAYMENT_ENDPOINT CLAIMS_INTEGRATION_TOKEN; do
  value="$(printenv "$name" || true)"
  if [ -z "$value" ]; then
    echo "$name is required" >&2
    exit 1
  fi
done

if [ "${#NEXTAUTH_SECRET}" -lt 32 ] || [ "${#CUSTOMER_JWT_SECRET}" -lt 32 ] || [ "${#CLAIMS_INTEGRATION_TOKEN}" -lt 32 ]; then
  echo "Application and integration secrets must contain at least 32 characters" >&2
  exit 1
fi

export PORT="$runtime_port"
export HOSTNAME="127.0.0.1"
cd "$app_dir"
if [[ "${NODE_ENV:-development}" != production ]]; then
  exec npm run dev -- -H 127.0.0.1 -p "$runtime_port"
fi
if [ "${STANDALONE:-0}" = "1" ]; then
  exec node server.js
fi
if [ -f .next/standalone/server.js ]; then
  exec node .next/standalone/server.js
fi
exec npm start -- -H 127.0.0.1 -p "$runtime_port"
