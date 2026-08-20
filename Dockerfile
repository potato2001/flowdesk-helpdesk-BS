FROM node:22-bookworm-slim

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run db:generate && npm run build

EXPOSE 3000
CMD ["sh", "-c", "npm run db:deploy && npm run db:seed && npm start"]
