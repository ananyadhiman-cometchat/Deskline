# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency and prisma files
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install all dependencies (including devDeps for build)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build with tsup
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Copy dependency files, prisma schema/migrations, and prisma config
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install production dependencies + tsx (needed to run prisma.config.ts)
RUN npm ci --omit=dev && npm install tsx

# Copy generated Prisma client from build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application
COPY --from=build /app/dist ./dist

# Copy seed script (standalone JS, no TS dependencies)
COPY scripts/docker-seed.js ./scripts/docker-seed.js

EXPOSE 4000

# Run migrations, seed (idempotent), then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node scripts/docker-seed.js && node dist/server.js"]
