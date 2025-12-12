# Dockerfile — multi-stage for Next.js (standalone) + Puppeteer-compatible Chrome
# Base image
FROM node:20-bullseye AS base
WORKDIR /app

# -----------------------
# deps stage
# -----------------------
FROM base AS deps
# install build tools for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  ca-certificates \
  gnupg \
  wget \
  unzip \
  procps \
  && rm -rf /var/lib/apt/lists/*

# copy package files only so Linux installs create linux-native node_modules
COPY package.json package-lock.json* ./
# use npm ci for reproducible install, ensure dev deps (override any global NODE_ENV)
RUN NODE_ENV=development npm ci

# Rebuild native modules (force compile-on-linux)
RUN npm rebuild --build-from-source better-sqlite3 lightningcss || true

# -----------------------
# builder stage
# -----------------------
FROM base AS builder
WORKDIR /app

# install build tools again for compile in builder stage
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  make \
  g++ \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# copy node_modules from deps (linux-built)
COPY --from=deps /app/node_modules ./node_modules
# copy source
COPY . .

# disable Next telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Ensure native modules rebuilt in builder
RUN npm rebuild --build-from-source better-sqlite3 lightningcss || true

# Build Next.js app
RUN npm run build

# -----------------------
# runner stage
# -----------------------
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Prevent Puppeteer from attempting to download Chromium (we'll use system chrome)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# Install Google Chrome stable + required libs/fonts for rendering
RUN apt-get update && apt-get install -y --no-install-recommends \
  wget \
  gnupg \
  ca-certificates \
  fonts-ipafont-gothic \
  fonts-wqy-zenhei \
  fonts-thai-tlwg \
  fonts-kacst \
  fonts-freefont-ttf \
  libxss1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libxkbcommon0 \
  libxshmfence1 \
  libx11-xcb1 \
  libxcb1 \
  libxext6 \
  libxrender1 \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*

# install google-chrome-stable
RUN wget -q -O /tmp/google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
  && apt-get update \
  && apt-get install -y --no-install-recommends /tmp/google-chrome.deb \
  && rm -f /tmp/google-chrome.deb

# Create non-root user to run the app
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# copy only the standalone output from the builder (Next.js standalone)
# this assumes you used `next build` and `next export` to create .next/standalone
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ensure directory ownership for prerender cache and .next files
RUN mkdir -p /app/.next && chown -R nextjs:nodejs /app/.next /app/public /app/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run the standalone server (Next.js creates server.js inside standalone)
CMD ["node", "server.js"]
