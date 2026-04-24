#!/usr/bin/env bash
set -euo pipefail

APP_PORT="${PORT:-3000}"
DB_NAME="insureflow"
DB_USER="${USER:-$(whoami)}"

echo "=========================================="
echo "  InsureFlow AI - Insurance Agency Platform"
echo "=========================================="
echo ""

# Set default DATABASE_URL if not provided
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "==> DATABASE_URL not set, using default..."
  export DATABASE_URL="postgresql://${DB_USER}@localhost:5432/${DB_NAME}?schema=public"
fi
echo "DATABASE_URL: ${DATABASE_URL}"

# Set other required environment variables with defaults
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://localhost:${APP_PORT}}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-insureflow-dev-secret-change-in-production}"

echo "NEXTAUTH_URL: ${NEXTAUTH_URL}"
echo ""

# Check if PostgreSQL is running
echo "==> Checking PostgreSQL status..."
if ! command -v psql &> /dev/null; then
  echo "WARNING: psql command not found. Assuming PostgreSQL is configured correctly."
else
  # Try to connect to PostgreSQL server (not specific database)
  if ! psql -h localhost -c "SELECT 1;" postgres >/dev/null 2>&1 && \
     ! psql -c "SELECT 1;" postgres >/dev/null 2>&1; then
    echo ""
    echo "ERROR: Cannot connect to PostgreSQL server."
    echo ""
    echo "Please start PostgreSQL:"
    echo "  macOS:  brew services start postgresql"
    echo "  Linux:  sudo systemctl start postgresql"
    echo ""
    exit 1
  fi
  echo "PostgreSQL server is running."

  # Create database if it doesn't exist
  echo ""
  echo "==> Ensuring database '${DB_NAME}' exists..."
  if ! psql -h localhost -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${DB_NAME}" && \
     ! psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "${DB_NAME}"; then
    echo "Creating database '${DB_NAME}'..."
    createdb "${DB_NAME}" 2>/dev/null || createdb -h localhost "${DB_NAME}" 2>/dev/null || {
      echo "Could not create database automatically."
      echo "Please create it manually: createdb ${DB_NAME}"
      exit 1
    }
    echo "Database created successfully!"
  else
    echo "Database '${DB_NAME}' already exists."
  fi
fi

# Clean up processes on the app port
echo ""
echo "==> Cleaning up processes on port ${APP_PORT}..."
if lsof -ti tcp:"${APP_PORT}" >/dev/null 2>&1; then
  echo "Found processes on port ${APP_PORT}, killing them..."
  lsof -ti tcp:"${APP_PORT}" | xargs kill -9 || true
  sleep 1
  echo "Processes on port ${APP_PORT} have been terminated."
else
  echo "No processes found on port ${APP_PORT}."
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo ""
  echo "==> Installing dependencies..."
  npm install
fi

# Generate Prisma client
echo ""
echo "==> Generating Prisma client..."
npx prisma generate

# Run database migrations
echo ""
echo "==> Running Prisma migrations..."
npx prisma db push || {
  echo "Migration failed. Trying to create initial schema..."
  npx prisma db push --force-reset
}

# Update .env file with current DATABASE_URL
echo ""
echo "==> Updating .env file..."
if [ -f ".env" ]; then
  # Update DATABASE_URL in .env if it exists, otherwise append
  if grep -q "^DATABASE_URL=" .env; then
    sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env 2>/dev/null || \
    sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"${DATABASE_URL}\"|" .env
  else
    echo "DATABASE_URL=\"${DATABASE_URL}\"" >> .env
  fi
else
  echo "DATABASE_URL=\"${DATABASE_URL}\"" > .env
  echo "NEXTAUTH_URL=\"${NEXTAUTH_URL}\"" >> .env
  echo "NEXTAUTH_SECRET=\"${NEXTAUTH_SECRET}\"" >> .env
fi
echo ".env file updated."

# Check if database has been seeded (using psql without the Prisma schema parameter)
echo ""
echo "==> Checking if database needs seeding..."
# Extract just the database connection parts without query params
PSQL_URL="postgresql://${DB_USER}@localhost:5432/${DB_NAME}"
CLIENT_COUNT=$(psql "${PSQL_URL}" -t -c "SELECT COUNT(*) FROM \"Client\";" 2>/dev/null | tr -d ' \n' || echo "0")
if [ "${CLIENT_COUNT}" = "0" ] || [ -z "${CLIENT_COUNT}" ]; then
  echo "Database appears empty. Running seed..."
  DATABASE_URL="${DATABASE_URL}" npm run db:seed
else
  echo "Database already contains data (${CLIENT_COUNT} clients). Skipping seed."
fi

# Start the application
echo ""
echo "=========================================="
echo "  Starting InsureFlow AI on port ${APP_PORT}"
echo "=========================================="
echo ""
echo "Access the application at: http://localhost:${APP_PORT}"
echo ""
echo "Auto-login enabled — no credentials needed"
echo "The app will automatically sign in as the Agency Owner."
echo ""

# ============================================
# Process monitoring with auto-restart
# ============================================

DEV_PID=""
STUDIO_PID=""
LOG_FILE="./dev-server.log"

cleanup() {
  echo ""
  echo "==> Shutting down InsureFlow..."
  [ -n "$DEV_PID" ] && kill "$DEV_PID" 2>/dev/null && echo "  Stopped dev server (PID $DEV_PID)"
  [ -n "$STUDIO_PID" ] && kill "$STUDIO_PID" 2>/dev/null && echo "  Stopped Prisma Studio (PID $STUDIO_PID)"
  # Kill any remaining child processes
  jobs -p | xargs kill 2>/dev/null || true
  echo "  Cleanup complete. Goodbye!"
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

health_check() {
  local max_attempts=30
  local attempt=0
  while [ $attempt -lt $max_attempts ]; do
    if curl -sf "http://localhost:${APP_PORT}/api/health" >/dev/null 2>&1 || \
       curl -sf "http://localhost:${APP_PORT}" >/dev/null 2>&1; then
      return 0
    fi
    attempt=$((attempt + 1))
    sleep 2
  done
  return 1
}

start_dev_server() {
  echo "  Starting Next.js dev server (hot reload enabled)..."
  npm run dev > "$LOG_FILE" 2>&1 &
  DEV_PID=$!
  echo "  Dev server PID: $DEV_PID"

  echo "  Waiting for server to be ready..."
  if health_check; then
    echo "  Server is ready at http://localhost:${APP_PORT}"
  else
    echo "  WARNING: Server may still be starting up. Check $LOG_FILE for details."
  fi
}

start_prisma_studio() {
  echo "  Starting Prisma Studio (DB browser) on port 5555..."
  npx prisma studio --port 5555 > /dev/null 2>&1 &
  STUDIO_PID=$!
  echo "  Prisma Studio PID: $STUDIO_PID (http://localhost:5555)"
}

if [ "${NODE_ENV:-development}" = "production" ]; then
  echo "Running in PRODUCTION mode..."
  npm run build
  npm run start
else
  echo "Running in DEVELOPMENT mode with hot reload..."
  echo ""
  echo "  Features:"
  echo "    - Next.js HMR (frontend hot reload)"
  echo "    - API route auto-reload (backend hot reload)"
  echo "    - Auto-restart on crash"
  echo "    - Prisma Studio (DB browser)"
  echo "    - Health monitoring"
  echo ""

  start_dev_server
  start_prisma_studio

  echo ""
  echo "=========================================="
  echo "  InsureFlow is running!"
  echo "  App:           http://localhost:${APP_PORT}"
  echo "  Prisma Studio: http://localhost:5555"
  echo "  Logs:          $LOG_FILE"
  echo "  Press Ctrl+C to stop all services"
  echo "=========================================="
  echo ""

  # Monitor dev server — auto-restart on crash
  RESTART_COUNT=0
  MAX_RESTARTS=5

  while true; do
    if ! kill -0 "$DEV_PID" 2>/dev/null; then
      RESTART_COUNT=$((RESTART_COUNT + 1))
      if [ $RESTART_COUNT -gt $MAX_RESTARTS ]; then
        echo ""
        echo "ERROR: Dev server crashed $MAX_RESTARTS times. Check $LOG_FILE for errors."
        echo "Last 20 lines of log:"
        tail -20 "$LOG_FILE" 2>/dev/null || true
        cleanup
      fi
      echo ""
      echo "WARNING: Dev server crashed! Restarting... (attempt $RESTART_COUNT/$MAX_RESTARTS)"
      sleep 2
      start_dev_server
    fi

    # Reset crash counter if server has been stable for 60 seconds
    if [ $RESTART_COUNT -gt 0 ]; then
      sleep 60
      if kill -0 "$DEV_PID" 2>/dev/null; then
        RESTART_COUNT=0
      fi
    else
      sleep 5
    fi
  done
fi
