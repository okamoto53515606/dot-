# Node.js 24（2026-11-11 のセキュリティリリース 24.22.3 以降を取得するためマイナーバージョンは固定しない）
# 24.22.3: CVE-2026-123863（HTTP/2 DoS）/ CVE-2026-126051（TLS DoS）/ CVE-2026-123864（HTTPS メモリ漏えい）
#          / CVE-2026-123866（HTTP/2 解放済みメモリ送信）ほか high 7 件・medium 6 件・low 3 件を修正
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
