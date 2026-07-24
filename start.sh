#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
app_dir="${RUNTIME_PROJECT_SOURCE:-$project_dir}"
cd "$app_dir"
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source ./.env
  set +a
fi
api_port="${API_PORT:-${PORT:-${BACKEND_PORT:-}}}"
ui_port="${UI_PORT:-${CLIENT_PORT:-${FRONTEND_PORT:-}}}"
[[ "$api_port" =~ ^[0-9]+$ && "$ui_port" =~ ^[0-9]+$ ]] || { echo "API and UI ports must be numeric" >&2; exit 2; }
[[ "$api_port" != "$ui_port" ]] || { echo "API and UI ports must be different" >&2; exit 2; }
for assigned_port in "$api_port" "$ui_port"; do
  if lsof -tiTCP:"$assigned_port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Assigned port $assigned_port is already in use; no process was stopped" >&2
    exit 1
  fi
done

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

export PORT="$ui_port"
export HOSTNAME="127.0.0.1"

child_pids=""
cleanup() {
  trap - EXIT INT TERM
  for child_pid in $child_pids; do kill "$child_pid" >/dev/null 2>&1 || true; done
  for child_pid in $child_pids; do wait "$child_pid" >/dev/null 2>&1 || true; done
}
trap cleanup EXIT INT TERM

if [[ "${NODE_ENV:-development}" != production ]]; then
  npm run dev -- -H 127.0.0.1 -p "$ui_port" &
elif [ "${STANDALONE:-0}" = "1" ]; then
  node server.js &
elif [ -f .next/standalone/server.js ]; then
  node .next/standalone/server.js &
else
  npm start -- -H 127.0.0.1 -p "$ui_port" &
fi
app_pid=$!
child_pids="$app_pid"

TARGET_HOST="127.0.0.1" TARGET_PORT="$ui_port" PROXY_HOST="127.0.0.1" PROXY_PORT="$api_port" \
  node scripts/runtime-proxy.cjs &
proxy_pid=$!
child_pids="$child_pids $proxy_pid"

echo "Insurance Agency API gateway listening on http://127.0.0.1:$api_port"
echo "Insurance Agency UI listening on http://127.0.0.1:$ui_port"

while kill -0 "$app_pid" >/dev/null 2>&1 && kill -0 "$proxy_pid" >/dev/null 2>&1; do sleep 1; done
runtime_result=1
if ! kill -0 "$app_pid" >/dev/null 2>&1; then
  wait "$app_pid" || runtime_result=$?
else
  wait "$proxy_pid" || runtime_result=$?
fi
exit "$runtime_result"
