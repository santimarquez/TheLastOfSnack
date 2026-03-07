# Build from repo root: docker build -f game-server/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY game-server ./game-server
RUN npm ci 2>/dev/null || npm install
RUN npm run build -w @last-of-snack/shared
RUN npm run build -w game-server

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/game-server/dist ./dist
COPY --from=builder /app/game-server/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/shared/package.json ./node_modules/@last-of-snack/shared/package.json
COPY --from=builder /app/shared/dist ./node_modules/@last-of-snack/shared/dist
ENV NODE_ENV=production
EXPOSE 4000
HEALTHCHECK --interval=5s --timeout=3s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4000/health', r => { let d=''; r.on('data',c=>d+=c); r.on('end',()=>process.exit(d.includes('ok')?0:1)); }).on('error',()=>process.exit(1))" || exit 1
CMD ["node", "dist/index.js"]
