FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS build
COPY . .
RUN DATABASE_URL='postgresql://build:build@database.invalid:5432/build' \
    NEXTAUTH_URL='https://build.invalid' \
    NEXTAUTH_SECRET='build-only-secret-more-than-thirty-two-characters' \
    CUSTOMER_JWT_SECRET='build-only-customer-secret-more-than-thirty-two' \
    CORS_ALLOWED_ORIGIN='https://build.invalid' \
    CLAIMS_EVIDENCE_ALLOWED_HOSTS='evidence.invalid' \
    npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 STANDALONE=1
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/start.sh ./start.sh
USER node
EXPOSE 3000
CMD ["./start.sh"]
