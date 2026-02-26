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
COPY --from=builder /app/shared/dist ./node_modules/@last-of-snack/shared/dist
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/index.js"]
