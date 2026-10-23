# Node.js 24（CVE-2026-111497 / Node2Shell 修正版 24.22.1 以降を取得するためマイナーバージョンは固定しない）
# ---- Stage 1: Dependencies ----
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --legacy-peer-deps

# ---- Stage 2: Build ----
FROM node:24-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---- Stage 3: Runner ----
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# standalone出力をコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
