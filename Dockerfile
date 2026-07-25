# Multi-stage build for Pulari.
# Note: next.config.ts does not enable `output: "standalone"`, so the runner
# uses the full `npm start` server rather than the standalone bundle.

# --- deps: install exactly the lockfile ---
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- build: compile with a placeholder key (never bake real secrets) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG GEMINI_API_KEY=build-placeholder
ENV GEMINI_API_KEY=$GEMINI_API_KEY
RUN npm run build

# --- run: production server; supply GEMINI_API_KEY at runtime ---
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S pulari && adduser -S pulari -G pulari
COPY --from=build --chown=pulari:pulari /app ./
USER pulari
EXPOSE 3000
CMD ["npm", "start"]
