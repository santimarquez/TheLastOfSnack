# Build from repo root: docker build -f frontend/Dockerfile .
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY shared ./shared
COPY frontend ./frontend
RUN npm ci 2>/dev/null || npm install
RUN npm run build -w @last-of-snack/shared
RUN npm run build -w frontend

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/frontend/.next/standalone ./
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "frontend/server.js"]