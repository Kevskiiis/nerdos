# Nerdos API

The Nerdos API is a Fastify 5 and TypeScript modular monolith. It provides authentication through Neon Auth and shared infrastructure for configuration, PostgreSQL and Redis access, health probes, request tracing, security, and a consistent error contract.

## Prerequisites

- Node.js 22 and Corepack
- pnpm 12.23.0, as specified in `package.json`
- PostgreSQL and TLS-enabled Redis services reachable through connection URLs
- A Neon Auth service and a cookie secret of at least 32 characters

The API uses Postgres.js over TCP and can connect to a compatible PostgreSQL service, including Neon. External PostgreSQL and Redis connections are not required to run the test suite.

## Get started

From the repository root:

```bash
cd nerdos-api
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Edit `nerdos-api/.env` with your frontend origin, PostgreSQL URL, Neon Auth URL, and cookie secret. The example values are placeholders; use a non-production Neon project or branch for local experiments. Generate a cookie secret with `openssl rand -base64 32`. Set up local Redis as described below, then start the API from the repository root:

```bash
make services-up
make dev-backend
```

`make dev-backend` loads `nerdos-api/.env`. Bash reads this file, so quote values containing shell characters such as `&`: `DATABASE_URL='postgresql://user:password@host/db?sslmode=require&channel_binding=require'`. Keep `.env` private and out of version control.

To run `pnpm dev` directly instead, export your environment first. The example local Redis URL is a **selector** interpreted by the Makefile, not an actual password; direct `pnpm dev` requires the generated password and CA certificate in `REDIS_URL` and `REDIS_CA_CERT`. For a separately hosted Redis service, set its real URL and any necessary CA certificate in your environment.

The development server listens at `http://localhost:3000` by default. Check it with:

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

### Local Redis with Docker Compose

The development compose file runs Redis with TLS and generated development-only credentials, bound to localhost on port `6380`. It does not replace Neon Auth or PostgreSQL. Install Docker with Compose and OpenSSL, then from the repository root run:

```bash
make services-setup
make services-up
```

Set `REDIS_URL=rediss://nerdos:local@127.0.0.1:6380` in `nerdos-api/.env` as a local-service selector. Keep your existing Neon database URL, Auth URL, and cookie secret there. From the repository root, run `make dev-backend`. The Makefile replaces the placeholder password with the generated value and loads the local CA certificate.

Generated credentials are stored in `dev/redis/.env` (mode 600); the ACL and TLS files are ignored by Git. The Redis container must read its ACL and TLS key, so these local-only container files are readable by local users. Never use the credentials or certificates outside local development. Stop the container with `make services-down`; its named volume retains data. Inspect logs with `make services-logs`.

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
| `REDIS_URL` | Required | TLS Redis URL (`rediss://`) with a username and password. |
| `REDIS_CA_CERT` | None | Optional PEM CA certificate for Redis; represent line breaks as `\n`. |
| `NEON_AUTH_BASE_URL` | Required | Neon Auth service URL. |
| `NEON_AUTH_COOKIE_SECRET` | Required | Secret used by the SDK to sign cached session-data cookies; at least 32 characters. |

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

Tests use Vitest. HTTP integration tests use Fastify injection and mocked PostgreSQL, Redis, and authentication clients; they do not need external services or open ports. The root Makefile also provides `make dev`, `make dev-backend`, `make dev-frontend`, `make build`, `make test`, `make typecheck`, and `make help`.

## HTTP behavior

| Endpoint | Purpose |
| --- | --- |
| `GET /health/live` | Reports process liveness, version, commit, uptime, and timestamp. |
| `GET /health/ready` | Checks PostgreSQL and Redis within a timeout and reports `ok` or `degraded`. |
| `GET /docs/` | Serves the Swagger UI outside production. |
| `GET /docs/json` | Serves the OpenAPI document outside production. |

Authentication routes are mounted under `/api/v1/auth`:

| Method and path | Purpose |
| --- | --- |
| `POST /register` | Register an account. |
| `POST /resend-verification` | Request another verification email. |
| `POST /forgot-password` | Request a password reset email. |
| `POST /login` | Sign in and receive session cookies. |
| `POST /verify-email` | Verify an email address. |
| `POST /reset-password` | Reset a password. |
| `GET /me` | Get the current user; requires a session. |
| `POST /logout` | End the current session; requires a session. |
| `POST /change-password` | Change the password; requires a session. |
| `POST /logout-all` | End all sessions; requires a session. |

Use the interactive documentation for request and response schemas. Browser clients must send credentials to use session cookies. The guard checks sessions with Neon instead of relying on the SDK's session-data cache. Cookies are forwarded with `SameSite=None; Secure; HttpOnly`, so browser testing requires a suitable secure context.

### Try registration

This request creates a real user in the configured Neon Auth project. Use an email address you control and a non-production project or branch:

```bash
curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Test User","email":"test@example.com","password":"a-long-test-password"}'
```

Registration accepts a `name`, email, and password. New passwords must be 12–128 characters, contain printable ASCII only, and not be blank. Verification and reset codes must be six digits. Existing passwords can be shorter when signing in. The API requests a verification code after signup; configure Neon Auth for email signup and code verification. Verification requires Neon to return a session cookie for automatic sign-in.

Registration and sending its verification code are separate operations. An error on the second step can occur after the account has already been created; check Neon Auth before retrying. Password reset similarly changes the password before signing in and revoking sessions, so a later failure can leave the password changed.

### Rate limiting

The global limit is 100 requests per minute per IP. Registration, resend verification, and forgot password share a 10-per-10-minute IP tier; login, email verification, and password reset share a 10-per-minute IP tier. Password change and logout-all also share a 10-per-10-minute user tier after authentication. Health probes are exempt. Exceeding a limit returns `429 RATE_LIMITED`; Redis failures return a retryable `503 SERVICE_UNAVAILABLE` rather than allowing requests through.

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

Validation failures return `422 VALIDATION_ERROR`; friendly field-specific messages appear in `meta_data.field_errors` with paths such as `/password`. Unexpected server errors are logged and returned with a sanitized detail. The readiness probe uses its own `{ "status": "degraded" }` response when a dependency check fails.

## Project layout

```text
src/
  app.ts                    # App factory and plugin registration
  server.ts                 # Startup and graceful shutdown
  modules/authentication/   # Neon Auth adapter, service, guard, and routes
  shared/
    cache/                  # Redis client and key builders
    config/                 # Environment validation and build metadata
    database/               # PostgreSQL pool
    docs/                   # OpenAPI and Swagger UI
    exceptions/             # Error contract and handlers
    http/                   # Security, session contract, rate limits, and trace IDs
    logging/                # Pino configuration
    observability/          # Health probes and load shedding
    types/                  # Fastify type augmentations
tests/                      # Unit and HTTP integration tests
dev/                        # Local Compose services and Redis configuration
```

Shared infrastructure must not depend on domain modules. The app factory accepts injected PostgreSQL, Redis, and authentication clients for tests and closes the database and Redis clients during shutdown.

## Docker

Build the image from `nerdos-api/`, optionally supplying release metadata:

```bash
docker build --build-arg APP_VERSION=0.1.0 --build-arg GIT_SHA="$(git rev-parse HEAD)" -t nerdos-api:local .
```

Run it with a Docker-compatible environment file containing `CLIENT_ORIGIN`, `DATABASE_URL`, `REDIS_URL`, `NEON_AUTH_BASE_URL`, and `NEON_AUTH_COOKIE_SECRET`:

```bash
docker run --rm -p 3000:3000 --env-file .env nerdos-api:local
```

The image runs as a non-root user and probes `/health/live` on port 3000. Ensure the database and Redis hostnames are reachable **from the container**; `localhost` inside the container refers to the container itself. The Dockerfile sets `NODE_ENV=production`, but values supplied with `--env-file` can override it, so set `NODE_ENV=production` in the file for a production-style run. The image health check assumes port 3000.

## Troubleshooting

- **Missing `DATABASE_URL` at startup:** Check `nerdos-api/.env`, quote URLs containing `&`, and restart with `make dev-backend`.
- **`503 SERVICE_UNAVAILABLE` from the rate limiter:** Run `make services-up`, check `make services-logs`, and confirm the local Redis selector is configured. `make dev-backend` loads the generated credentials and CA; direct `pnpm dev` does not.
- **`/health/ready` returns 503:** Either PostgreSQL or Redis is unavailable or timed out. `/health/live` checks only the process.
- **Registration returns an authentication error:** Confirm the Auth URL, allowed origin, email signup, and verification-code settings in Neon. A failed verification-email request may follow a successful account creation, so check the Neon user list before retrying. Never share credentials, cookies, or `.env` when seeking help.
