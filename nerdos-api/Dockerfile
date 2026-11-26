FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build && pnpm prune --prod

FROM node:22-alpine AS runner
WORKDIR /app
ARG APP_VERSION=""
ARG GIT_SHA=""
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    APP_VERSION=${APP_VERSION} \
    GIT_SHA=${GIT_SHA}
LABEL org.opencontainers.image.version=${APP_VERSION} \
      org.opencontainers.image.revision=${GIT_SHA}
RUN addgroup -S fastify && adduser -S -G fastify fastify
COPY --from=build --chown=fastify:fastify /app/package.json ./package.json
COPY --from=build --chown=fastify:fastify /app/node_modules ./node_modules
COPY --from=build --chown=fastify:fastify /app/dist ./dist
USER fastify
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('node:http').get('http://127.0.0.1:3000/health/live', (res) => { res.resume(); process.exitCode = res.statusCode === 200 ? 0 : 1; }).on('error', () => { process.exitCode = 1; });"
CMD ["node", "dist/server.js"]
