FROM node:18-alpine AS base

# Step 1. Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Omit --production flag for TypeScript devDependencies
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --network-timeout 100000; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i; \
  # Allow install without lockfile, so example works even without Node.js installed locally
  else echo "Warning: Lockfile not found. It is recommended to commit lockfiles to version control." && yarn install; \
  fi


COPY lib ./lib
COPY pages ./pages
COPY public ./public
COPY styles ./styles
COPY next.config.js .
COPY postcss.config.js .
COPY tailwind.config.js .
COPY tsconfig.json .


# Environment variables must be present at build time
# https://github.com/vercel/next.js/discussions/14030
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ARG ZOOM_CLIENT_SECRET
ENV ZOOM_CLIENT_SECRET=${ZOOM_CLIENT_SECRET}
ARG GOOGLE_CLIENT_ID_WEB
ENV GOOGLE_CLIENT_ID_WEB=${GOOGLE_CLIENT_ID_WEB}
ARG GOOGLE_CLIENT_SECRET_WEB
ENV GOOGLE_CLIENT_SECRET_WEB=${GOOGLE_CLIENT_SECRET_WEB}
ARG GOOGLE_REDIRECT_URL
ENV GOOGLE_REDIRECT_URL=${GOOGLE_REDIRECT_URL}
ARG HANDSHAKE_URL
ENV HANDSHAKE_URL=${HANDSHAKE_URL}
ARG ZOOM_IV_FOR_PASS
ENV ZOOM_IV_FOR_PASS=${ZOOM_IV_FOR_PASS}
ARG ZOOM_SALT_FOR_PASS
ENV ZOOM_SALT_FOR_PASS=${ZOOM_SALT_FOR_PASS}

ARG HASURA_GRAPHQL_ADMIN_SECRET
ENV HASURA_GRAPHQL_ADMIN_SECRET=${HASURA_GRAPHQL_ADMIN_SECRET}
ARG ZOOM_WEBHOOK_SECRET_TOKEN
ENV ZOOM_WEBHOOK_SECRET_TOKEN=${ZOOM_WEBHOOK_SECRET_TOKEN}
ARG ZOOM_PASS_KEY
ENV ZOOM_PASS_KEY=${ZOOM_PASS_KEY}
ARG NEXT_PUBLIC_ZOOM_REDIRECT_URL
ENV NEXT_PUBLIC_ZOOM_REDIRECT_URL=${NEXT_PUBLIC_ZOOM_REDIRECT_URL}
ARG NEXT_PUBLIC_ZOOM_CLIENT_ID
ENV NEXT_PUBLIC_ZOOM_CLIENT_ID=${NEXT_PUBLIC_ZOOM_CLIENT_ID}
ARG ZOOM_CLIENT_ID
ENV ZOOM_CLIENT_ID=${ZOOM_CLIENT_ID}

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at build time
# ENV NEXT_TELEMETRY_DISABLED 1

# Build Next.js based on the preferred package manager
RUN \
  if [ -f yarn.lock ]; then yarn build; \
  elif [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then pnpm build; \
  else yarn build; \
  fi

# Note: It is not necessary to add an intermediate step that does a full copy of `node_modules` here

# Step 2. Production image, copy all the files and run next
FROM base AS runner

WORKDIR /app

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Environment variables must be redefined at run time
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ARG ZOOM_CLIENT_SECRET
ENV ZOOM_CLIENT_SECRET=${ZOOM_CLIENT_SECRET}
ARG GOOGLE_CLIENT_ID_WEB
ENV GOOGLE_CLIENT_ID_WEB=${GOOGLE_CLIENT_ID_WEB}
ARG GOOGLE_CLIENT_SECRET_WEB
ENV GOOGLE_CLIENT_SECRET_WEB=${GOOGLE_CLIENT_SECRET_WEB}
ARG GOOGLE_REDIRECT_URL
ENV GOOGLE_REDIRECT_URL=${GOOGLE_REDIRECT_URL}
ARG HANDSHAKE_URL
ENV HANDSHAKE_URL=${HANDSHAKE_URL}
ARG ZOOM_IV_FOR_PASS
ENV ZOOM_IV_FOR_PASS=${ZOOM_IV_FOR_PASS}
ARG ZOOM_SALT_FOR_PASS
ENV ZOOM_SALT_FOR_PASS=${ZOOM_SALT_FOR_PASS}

ARG HASURA_GRAPHQL_ADMIN_SECRET
ENV HASURA_GRAPHQL_ADMIN_SECRET=${HASURA_GRAPHQL_ADMIN_SECRET}
ARG ZOOM_WEBHOOK_SECRET_TOKEN
ENV ZOOM_WEBHOOK_SECRET_TOKEN=${ZOOM_WEBHOOK_SECRET_TOKEN}
ARG ZOOM_PASS_KEY
ENV ZOOM_PASS_KEY=${ZOOM_PASS_KEY}
ARG NEXT_PUBLIC_ZOOM_REDIRECT_URL
ENV NEXT_PUBLIC_ZOOM_REDIRECT_URL=${NEXT_PUBLIC_ZOOM_REDIRECT_URL}
ARG NEXT_PUBLIC_ZOOM_CLIENT_ID
ENV NEXT_PUBLIC_ZOOM_CLIENT_ID=${NEXT_PUBLIC_ZOOM_CLIENT_ID}
ARG ZOOM_CLIENT_ID
ENV ZOOM_CLIENT_ID=${ZOOM_CLIENT_ID}


# Uncomment the following line to disable telemetry at run time
# ENV NEXT_TELEMETRY_DISABLED 1

# Note: Don't expose ports here, Compose will handle that for us

CMD ["node", "server.js"]