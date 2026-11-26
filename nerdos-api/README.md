# Nerdos API

The Nerdos API is a Fastify 5 and TypeScript modular monolith. It currently provides the shared foundation for future domain modules: configuration, PostgreSQL and Redis access, health probes, request tracing, security, and a consistent error contract. Domain endpoints have not been implemented yet.

## Prerequisites

- Node.js 22 and Corepack
- pnpm 12.23.0, as specified in `package.json`
- PostgreSQL and Redis services reachable through connection URLs for readiness checks

The API uses Postgres.js over TCP and can connect to a compatible PostgreSQL service, including Neon. External PostgreSQL and Redis connections are not required to run the test suite.

## Get started

From the repository root:

```bash
cd nerdos-api
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Edit `.env` with your PostgreSQL and Redis URLs and frontend origin. The application reads environment variables from the process; it does **not** automatically load `.env`. For a shell-compatible `.env` file, export its values before starting the server:

```bash
set -a
. ./.env
set +a
pnpm dev
```

The development server listens at `http://localhost:3000` by default. Check it with:

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

Liveness works without dependency connections. Readiness requires working PostgreSQL and Redis connections and returns `503` when either is unavailable or a check times out. Interactive API documentation is available at [http://localhost:3000/docs/](http://localhost:3000/docs/) outside production; the OpenAPI document is at `/docs/json`.

## Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | `development`, `test`, or `production`. Documentation is disabled in production. |
| `HOST` | `0.0.0.0` | Listen address. |
| `PORT` | `3000` | Listen port, from 1 to 65535. |
| `LOG_LEVEL` | `info` | Pino log level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, or `silent`. |
| `CLIENT_ORIGIN` | Required | Allowed HTTP(S) origin for credentialed CORS, without a path or trailing slash. |
| `DATABASE_URL` | Required | PostgreSQL connection URL using `postgres://` or `postgresql://`. |
| `REDIS_URL` | Required | Redis connection URL, such as `redis://localhost:6379`. |

Configuration is validated at startup. Set secrets in the environment or a local, untracked `.env` file; `.env.example` contains placeholders only.

Build metadata defaults to the package name and version. `APP_VERSION` overrides the package version; the commit comes from `GIT_SHA`, `RENDER_GIT_COMMIT`, `RAILWAY_GIT_COMMIT_SHA`, or `VERCEL_GIT_COMMIT_SHA`, in that order, with `local` as the fallback. Commit values are shortened to seven characters.

## Commands

Run these from `nerdos-api/`:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Run the TypeScript server with watch mode. |
| `pnpm run build` | Compile TypeScript to `dist/`. |
| `pnpm start` | Run the compiled server; build first. |
| `pnpm exec tsc --noEmit` | Check source types without emitting files. |
| `pnpm test` | Run all tests once. |
| `pnpm test:unit` | Run unit tests. |
| `pnpm test:integration` | Run integration tests. |

Tests use Vitest. HTTP integration tests use Fastify injection and mocked PostgreSQL and Redis clients; they do not need external services or open ports. Tests under `tests/shared/` mirror the shared source directories.

## HTTP behavior

| Endpoint | Purpose |
| --- | --- |
| `GET /health/live` | Reports process liveness, version, commit, uptime, and timestamp. |
| `GET /health/ready` | Checks PostgreSQL and Redis within a timeout and reports `ok` or `degraded`. |
| `GET /docs/` | Serves the Swagger UI outside production. |
| `GET /docs/json` | Serves the OpenAPI document outside production. |

Requests may supply an `x-trace-id` header; otherwise the API generates one. Responses include `x-trace-id` and `x-app-version`. Request logs include the trace ID, and configured sensitive fields are redacted. Security headers and credentialed CORS are enabled. The service sheds requests under high event-loop delay or heap usage; liveness remains available during load shedding.

Errors handled by the shared error handler use this JSON shape:

```json
{
  "status": 404,
  "code": "NOT_FOUND",
  "detail": "Resource not found",
  "instance": "/missing",
  "trace_id": "example-trace-id",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "retryable": false
}
```

Some errors also include `meta_data`, such as field errors for validation failures. Unexpected server errors are logged and returned with a sanitized detail. The readiness probe uses its own `{ "status": "degraded" }` response when a dependency check fails.

## Project layout

```text
src/
  app.ts                    # App factory and plugin registration
  server.ts                 # Startup and graceful shutdown
  modules/                  # Reserved for future domain modules
  shared/
    cache/                  # Redis client and key builders
    config/                 # Environment validation and build metadata
    database/               # PostgreSQL pool
    docs/                   # OpenAPI and Swagger UI
    exceptions/             # Error contract and handlers
    http/                   # Security and trace IDs
    logging/                # Pino configuration
    observability/          # Health probes and load shedding
    types/                  # Fastify type augmentations
tests/                      # Unit and HTTP integration tests
```

Shared infrastructure must not depend on domain modules. The app factory accepts injected PostgreSQL and Redis clients for tests and closes both during shutdown.

## Docker

Build the image from `nerdos-api/`, optionally supplying release metadata:

```bash
docker build --build-arg APP_VERSION=1.0.0 --build-arg GIT_SHA="$(git rev-parse HEAD)" -t nerdos-api:local .
```

Run it with a Docker-compatible environment file containing `CLIENT_ORIGIN`, `DATABASE_URL`, and `REDIS_URL`:

```bash
docker run --rm -p 3000:3000 --env-file .env nerdos-api:local
```

The image runs as a non-root user and probes `/health/live` on port 3000. Ensure the database and Redis hostnames are reachable **from the container**; `localhost` inside the container refers to the container itself. The Dockerfile sets `NODE_ENV=production`, but values supplied with `--env-file` can override it, so set `NODE_ENV=production` in the file for a production-style run. The image health check assumes port 3000.
