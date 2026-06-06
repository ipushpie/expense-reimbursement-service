FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl openssl
# Install ALL deps (including devDeps) so ts-node is available for prisma seed
COPY package*.json ./
RUN npm ci
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
EXPOSE 4000
# Migrate → Seed (idempotent via upsert) → Start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node dist/server.js"]
