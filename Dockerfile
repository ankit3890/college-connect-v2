# Dockerfile — multi-stage for Next.js standalone + headful Puppeteer (Xvfb) + ngrok
FROM node:20-bullseye AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# -----------------------
# deps (linux build of node_modules)
# -----------------------
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 make g++ ca-certificates gnupg wget unzip procps \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
# ensure devDependencies are installed for build
RUN NODE_ENV=development npm ci

# rebuild native modules to ensure linux binaries
RUN npm rebuild --build-from-source better-sqlite3 lightningcss || true

# -----------------------
# builder (build Next)
# -----------------------
FROM base AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
RUN npm run build

# -----------------------
# runner (final image)
# -----------------------
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable

# libs + Xvfb + fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
  xvfb wget gnupg ca-certificates \
  fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
  libxss1 libasound2 libatk-bridge2.0-0 libatk1.0-0 libcups2 libdrm2 libgbm1 libgtk-3-0 \
  libnspr4 libnss3 libxcomposite1 libxdamage1 libxrandr2 libxkbcommon0 libxshmfence1 \
  libx11-xcb1 libxcb1 libxext6 libxrender1 xdg-utils unzip \
  && rm -rf /var/lib/apt/lists/*

# install google-chrome-stable
RUN wget -q -O /tmp/google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
  && apt-get update \
  && apt-get install -y --no-install-recommends /tmp/google-chrome.deb \
  && rm -f /tmp/google-chrome.deb

# install ngrok CLI (binary)
RUN wget -q -O /tmp/ngrok.zip https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.zip \
  && unzip /tmp/ngrok.zip -d /usr/local/bin \
  && rm /tmp/ngrok.zip \
  && chmod +x /usr/local/bin/ngrok || true

# create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# copy app files (Next standalone output)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# ensure dirs and ownership
RUN mkdir -p /app/.next && chown -R nextjs:nodejs /app/.next /app/public /app/.next/static

# copy start script with owner and permission (BuildKit supports --chmod)
COPY --chown=nextjs:nodejs --chmod=0755 start.sh /app/start.sh

USER nextjs

EXPOSE 3000
ENV HOSTNAME="0.0.0.0"

CMD ["/app/start.sh"]
