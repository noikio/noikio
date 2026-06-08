FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
RUN npm install

COPY backend ./backend
COPY frontend ./frontend
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist

RUN mkdir -p /app/backend/data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000
CMD ["node", "backend/dist/index.js"]
