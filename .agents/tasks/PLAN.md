# Nerdos API — Redis Rate Limiting & Authentication Module Plan

This plan extends the `nerdos-api` shared foundation with **fail-closed Redis rate limiting** (`src/shared/`) and an **isolated Authentication module** (`src/modules/authentication/`) backed by Neon Managed Auth (`@neondatabase/auth`). Each sprint is tightly scoped (2–4 source files + mirrored tests) so an AI agent can execute it in a single fresh session without context drift.

## Global Engineering Rules (Apply to Every Sprint)

1. **Execute One Sprint Per Session:** Complete ONLY the requested sprint. Do not start or scaffold files for subsequent sprints.
2. **Create Directories Explicitly:** Never assume subfolders exist—create parent directories in `src/` and `tests/` before writing files.
3. **Documentation:** Add a concise 1–2 sentence JSDoc comment (`/** ... */`) above every exported function, class, type helper, and Fastify plugin.
4. **Strict Modular Isolation:**
   - `src/shared/` holds domain-agnostic infrastructure only and must **never** import from `src/modules/`.
   - `src/modules/authentication/` may only import from `src/shared/` and external packages.
   - `AuthUser` is strictly private to `src/modules/authentication/` and must **never** be placed in `src/shared/` or attached to `FastifyRequest`.
   - The only shared auth contract across modules is `requestSessionSchema` / `RequestSession` in `src/shared/http/session.schema.ts`, `request.session: RequestSession | null`, and `app.requireAuth` in `src/shared/types/fastify.d.ts`.
5. **Testing (Mirrored `tests/` Layout):**
   - Mirror `src/` 1-to-1 inside `tests/` (`.unit.test.ts` for isolated logic, `.integration.test.ts` for Fastify `app.inject()` HTTP tests).
   - Mock Redis and Neon Auth in automated tests so `pnpm test` runs deterministically with zero external network calls.
6. **Strict Types & ESM:** Use ESM imports with `.js` extensions (`NodeNext`) and Zod schemas for all inputs/outputs.
7. **Verification Gate:** Run `pnpm exec tsc --noEmit && pnpm test` and ensure zero errors before committing.
8. **Progress Tracking & Git Hygiene:**
   - After passing the verification gate, mark every completed task in the current sprint as `[x]` in `PLAN.md`.
   - Include `PLAN.md` in the sprint's **local git commit**. **Never run `git push`.**

---

## Sprint 8: Shared Redis Client (TLS + Auth), Key Schema & Readiness Probe

**Goal:** Add a fail-fast, TLS-enforced `ioredis` client and centralized key builder to `src/shared/cache/`, and update `/health/ready` to fail closed (`503`) when Redis is down while keeping `/health/live` fail-open.

### Tasks
- [x] Install `ioredis`: `pnpm add ioredis`.
- [x] Create directories: `mkdir -p src/shared/cache tests/shared/cache`.
- [x] Update `src/shared/config/env.ts` and `.env.example`:
  - Add required `REDIS_URL` (string) with Zod `.superRefine()` / `.refine()` validation enforcing:
    - Valid URL parseable via `new URL(val)`.
    - Protocol is strictly `rediss:` (TLS enforced).
    - Non-empty `url.username` and non-empty `url.password`.
  - Add optional `REDIS_CA_CERT` (string, optional) for custom/private CA certificates (normalize literal `\n` escapes to real newlines if passed as a single-line env var).
- [x] Update `src/shared/types/fastify.d.ts`:
  - Augment `FastifyInstance` with `redis: Redis` (imported from `ioredis`).
- [x] Create `src/shared/cache/redis-keys.ts`:
  - Export `RedisSubsystem = "rl" | "cache"`.
  - Normalize `NODE_ENV` via a strict map: `development -> "dev"`, `test -> "test"`, `production -> "prod"`.
  - Export `buildRedisNamespace(subsystem, nodeEnv?)` returning `nerdos:<env>:<subsystem>:`.
  - Export `buildRedisKey(subsystem, tier, identifier, nodeEnv?)` returning `nerdos:<env>:<subsystem>:<tier>:<identifier>`.
- [x] Create `src/shared/cache/redis.ts`:
  - Export a `fastify-plugin` (`fp`) named `redisPlugin` accepting optional `{ redis?: Redis }` plugin options for deterministic testing.
  - When no mock is injected, initialize `new Redis(env.REDIS_URL, options)` with:
    - **No `keyPrefix`** (namespaces are owned by `redis-keys.ts` to prevent double-prefixing).
    - `tls: { rejectUnauthorized: true, ...(env.REDIS_CA_CERT ? { ca: env.REDIS_CA_CERT } : {}) }`
    - `connectTimeout: 2000`
    - `commandTimeout: 1500`
    - `maxRetriesPerRequest: 1`
    - `enableOfflineQueue: false`
    - `lazyConnect: true`
    - `enableReadyCheck: true`
    - `keepAlive: 15000`
    - `db: 0`
    - `connectionName: \`nerdos-api-${envTag}\``
    - `retryStrategy: (times) => Math.min(times * 200, 5000)`
  - Attach a `redis.on("error", (err) => ...)` listener that logs via `fastify.log.error` with **only** safe fields (`err.name`, `err.message`, `code`)—never log `REDIS_URL`, `username`, or `password`.
  - Decorate `fastify.redis` and close cleanly in `onClose` (`await redis.quit()`, falling back to `redis.disconnect()` if quit fails).
- [x] Update `src/shared/observability/health.routes.ts`:
  - Keep `GET /health/live` completely dependency-free (always returns `200 OK`).
  - Update `GET /health/ready` to check both Postgres (`SELECT 1`) and Redis (`fastify.redis.ping()`) with short timeouts; return `503` (`status: "degraded"`) if either dependency fails, and `200` when both succeed.
- [x] Update `src/app.ts` to register `redisPlugin` before `healthRoutes`.
- [x] Create/update tests:
  - `tests/shared/config/env.unit.test.ts`: Verify `REDIS_URL` rejects `redis://` (non-TLS), missing username, or missing password, and accepts `rediss://user:pass@host:6379`.
  - `tests/shared/cache/redis-keys.unit.test.ts`: Verify `buildRedisNamespace` and `buildRedisKey` across `development`, `test`, and `production`.
  - `tests/shared/cache/redis.unit.test.ts`: Verify fail-fast options (`commandTimeout`, `connectTimeout`, `enableOfflineQueue: false`, `tls.rejectUnauthorized: true`, no `keyPrefix`), credential-safe error logging, and `onClose` cleanup.
  - Update `tests/shared/observability/health.routes.integration.test.ts`: Verify `/health/live` stays `200` when mocked `redis.ping()` rejects, while `/health/ready` returns `503` (`"degraded"`) when Redis or Postgres fails and `200` when both are healthy.
- [x] Mark all Sprint 8 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add package.json pnpm-lock.yaml .env.example PLAN.md src/shared/ src/app.ts tests/shared/
git commit -m "feat(cache): add tls-enforced fail-fast redis client, key builder, and readiness check"
```

---

## Sprint 9: Shared Fail-Closed Rate Limiter & Policy Factory

**Goal:** Build a domain-agnostic `@fastify/rate-limit` shared module backed by `fastify.redis` with fail-closed `503` behavior, global defaults, and a reusable `createRateLimitPolicy()` factory that works for both public (`onRequest` IP) and protected (`preHandler` `request.session.userId`) routes.

### Tasks
- [x] Install `@fastify/rate-limit` if not already installed: `pnpm add @fastify/rate-limit`.
- [x] Create `src/shared/http/rate-limit.ts`:
  - Export `RateLimitKeyStrategy = "ip" | "user" | ((req: FastifyRequest) => string)`.
  - Export `RateLimitPolicyInput`: `{ tier: string; max: number; timeWindow: string | number; keyBy?: RateLimitKeyStrategy }`.
  - Export `createRateLimitPolicy(input: RateLimitPolicyInput): RateLimitOptions`:
    - Generates `keyGenerator` returning `${tier}:${identifier}` where `identifier` is:
      - `keyBy(req)` if function,
      - `req.session?.userId ?? req.ip` if `"user"`,
      - `req.ip` if `"ip"` (default).
    - Designed to work identically in `config: { rateLimit: policy }` (public routes, runs at `onRequest`) and `app.rateLimit(policy)` (protected routes, chained in `preHandler` after `app.requireAuth`).
  - Export `rateLimitPlugin` (`fastify-plugin` / `fp`) registering `@fastify/rate-limit` with:
    - `redis: fastify.redis`
    - `nameSpace: buildRedisNamespace("rl")` (producing full keys `nerdos:<env>:rl:<tier>:<identifier>`)
    - `skipOnError: false` (strict fail-closed)
    - Global default policy: `createRateLimitPolicy({ tier: "global", max: 100, timeWindow: "1 minute", keyBy: "ip" })`
    - `allowList` / exemption for `/health/live` and `/health/ready` so PaaS probes are never rate-limited
    - `errorResponseBuilder` throwing `AppError(429, "RATE_LIMITED", "Too many requests. Please try again later.")`.
- [x] Normalize rate-limit store failures at the Redis store boundary (the existing error handler formats the resulting `AppError`):
  - Detect Redis connection, timeout, or store errors bubbling out of `@fastify/rate-limit` (e.g., `ioredis` `ReplyError`, `Command timed out`, `Connection is closed`, `ECONNREFUSED`, `Stream isn't writeable`) and normalize them to `503 SERVICE_UNAVAILABLE` (`retryable: true`) matching `errorResponseSchema`.
- [x] Update `src/app.ts` to register `rateLimitPlugin` immediately after `redisPlugin`.
- [x] Create tests:
  - `tests/shared/http/rate-limit.unit.test.ts`: Verify `createRateLimitPolicy` outputs `${tier}:${ip}`, `${tier}:${session.userId}` when `req.session` is present, falls back to IP when `req.session` is null, and supports custom key functions.
  - `tests/shared/http/rate-limit.integration.test.ts`:
    - Verify global default limit enforcement returns `429 RATE_LIMITED` with standard `errorResponseSchema`.
    - Verify public route override via `config: { rateLimit: createRateLimitPolicy(...) }` isolates its bucket from the global bucket.
    - Verify protected route two-stage limiting via `preHandler: [mockAuth, app.rateLimit(createRateLimitPolicy({ ..., keyBy: "user" }))]` keys by `request.session.userId`.
    - Verify fail-closed behavior: when mocked `fastify.redis` throws a connection/timeout error, requests return `503 SERVICE_UNAVAILABLE` (`retryable: true`).
    - Verify `/health/live` and `/health/ready` are exempt from rate limiting.
- [x] Mark all Sprint 9 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add package.json pnpm-lock.yaml PLAN.md src/shared/http/rate-limit.ts src/shared/exceptions/error-handler.ts src/app.ts tests/shared/http/
git commit -m "feat(http): add fail-closed redis rate limiter and reusable policy factory"
```

---

## Sprint 10: Shared Session Schema, Fastify Auth Contract & Module Scaffolding

**Goal:** Define the minimal, domain-agnostic session schema in `src/shared/http/session.schema.ts`, wire `request.session` and `app.requireAuth` into `src/shared/types/fastify.d.ts`, and scaffold `src/modules/authentication/`.

### Tasks
- [x] Create directories: `mkdir -p src/modules/authentication tests/modules/authentication`.
- [x] Create `src/shared/http/session.schema.ts`:
  - Export `requestSessionSchema`:
    ```ts
    z.object({
      sessionId: z.string().min(1),
      userId: z.string().min(1),
      expiresAt: z.string().datetime(),
    })
    ```
  - Export `type RequestSession = z.infer<typeof requestSessionSchema>`.
- [x] Update `src/shared/config/env.ts` and `.env.example`:
  - Add required `NEON_AUTH_BASE_URL` (valid URL).
  - Add required `NEON_AUTH_COOKIE_SECRET` (string, min 32 chars).
- [x] Update `src/shared/types/fastify.d.ts`:
  - Import `RequestSession` from `@shared/http/session.schema.js`.
  - Augment `FastifyRequest` with **only** `session: RequestSession | null` (do **not** add `user` or `AuthUser` here).
  - Augment `FastifyInstance` with `requireAuth: preHandlerHookHandler`.
- [x] Update `src/shared/exceptions/error-codes.ts`:
  - Add canonical auth error codes if not already present: `INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED`, `EMAIL_ALREADY_EXISTS`, `INVALID_OR_EXPIRED_CODE`.
- [x] Create/update tests:
  - `tests/shared/http/session.schema.unit.test.ts`: Verify `requestSessionSchema` accepts valid session payloads and rejects missing `sessionId`, missing `userId`, or invalid `expiresAt` timestamps.
  - Update `tests/shared/config/env.unit.test.ts` to verify `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` (including min-32-char rejection).
- [x] Mark all Sprint 10 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add .env.example PLAN.md src/shared/ tests/shared/
git commit -m "feat(shared): add shared session schema, auth env vars, and fastify session types"
```

---

## Sprint 11: Auth Schemas (Private `AuthUser`), Rate-Limit Policies & Error Mapper

**Goal:** Build the isolated Zod validation schemas (including the module-private `authUserSchema` and 12-char password minimum), authentication rate-limit policies, and Neon Auth error mapper inside `src/modules/authentication/`.

### Tasks
- [x] Create `src/modules/authentication/auth.schemas.ts`:
  - Export module-private `authUserSchema` (`{ id: z.string().min(1), email: z.string().email(), name: z.string().nullable().optional(), emailVerified: z.boolean() }`) and `type AuthUser = z.infer<typeof authUserSchema>`.
  - Export reusable fields:
    - `emailSchema`: `z.string().trim().toLowerCase().email()`
    - `passwordSchema`: `z.string().min(12).max(128)`
    - `usernameSchema`: `z.string().trim().min(3).max(32)`
    - `otpCodeSchema`: `z.string().trim().min(4).max(12)`
  - Export request & response Zod schemas for all 10 endpoints:
    - `registerBodySchema` (`username`, `email`, `password`) & `registerResponseSchema`
    - `verifyEmailBodySchema` (`email`, `code`) & `authUserResponseSchema`
    - `resendVerificationBodySchema` (`email`) & `messageResponseSchema`
    - `loginBodySchema` (`email`, `password`) & `authUserResponseSchema`
    - `logoutResponseSchema` & `logoutAllResponseSchema`
    - `meResponseSchema` (wrapping `authUserSchema`)
    - `forgotPasswordBodySchema` (`email`) & `messageResponseSchema`
    - `resetPasswordBodySchema` (`email`, `code`, `newPassword`) & `messageResponseSchema`
    - `changePasswordBodySchema` (`currentPassword`, `newPassword`) & `messageResponseSchema`
- [x] Create `src/modules/authentication/auth.rate-limits.ts`:
  - Use `createRateLimitPolicy` from `@shared/http/rate-limit.js` to export `AUTH_RATE_LIMITS`:
    - `bruteForce`: `{ tier: "auth-brute", max: 10, timeWindow: "1 minute", keyBy: "ip" }`
    - `emailTrigger`: `{ tier: "email-trigger", max: 10, timeWindow: "10 minutes", keyBy: "ip" }`
    - `sensitiveUserAction`: `{ tier: "auth-user-sensitive", max: 10, timeWindow: "10 minutes", keyBy: "user" }`
- [x] Create `src/modules/authentication/auth.errors.ts`:
  - Export `mapAuthError(error: unknown): AppError` translating Neon Auth / Better Auth error codes and statuses into canonical `AppError` instances:
    - Invalid email/password -> `401 INVALID_CREDENTIALS`
    - Unverified email -> `403 EMAIL_NOT_VERIFIED`
    - Duplicate email -> `409 EMAIL_ALREADY_EXISTS`
    - Invalid/expired OTP or reset token -> `400 INVALID_OR_EXPIRED_CODE`
    - Missing/expired session -> `401 UNAUTHORIZED`
    - Upstream network/5xx error -> `503 SERVICE_UNAVAILABLE` (`retryable: true`)
    - Pass through existing `AppError` instances unchanged.
- [x] Create unit tests:
  - `tests/modules/authentication/auth.schemas.unit.test.ts`: Verify 12-char password rejection/acceptance, email trimming/lowercasing, username length bounds, and `authUserSchema` validation.
  - `tests/modules/authentication/auth.errors.unit.test.ts`: Verify every Neon Auth error code maps to the expected `AppError` status, code, and `retryable` flag.
- [x] Mark all Sprint 11 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add PLAN.md src/modules/authentication/auth.schemas.ts src/modules/authentication/auth.rate-limits.ts src/modules/authentication/auth.errors.ts tests/modules/authentication/
git commit -m "feat(authentication): add zod schemas, rate-limit policies, error mapper, and unit tests"
```

---

## Sprint 12: Neon Auth Client Adapter & Session-Only `requireAuth` Guard

**Goal:** Wrap `@neondatabase/auth` with cross-site cookie normalization (`SameSite=None; Secure; HttpOnly`) and implement the `requireAuth` Fastify `preHandler` guard that validates and attaches only `request.session`.

### Tasks
- [x] Create `src/modules/authentication/auth.client.ts`:
  - Define a clean `AuthClient` interface abstracting the Neon Auth operations (`signUp`, `verifyEmail`, `resendVerification`, `signIn`, `signOut`, `revokeAllSessions`, `getSession`, `getMe`, `forgotPassword`, `resetPassword`, `changePassword`).
  - Implement `createNeonAuthClient()` using `@neondatabase/auth` with `env.NEON_AUTH_BASE_URL` and `env.NEON_AUTH_COOKIE_SECRET`.
  - Export `normalizeCrossSiteCookies(setCookieHeaders: string[]): string[]` ensuring every forwarded `Set-Cookie` header enforces `SameSite=None; Secure; HttpOnly; Path=/` so separate-domain CORS requests persist session cookies reliably.
- [x] Create `src/modules/authentication/auth.guard.ts`:
  - Export `createRequireAuth(getSession)` returning a Fastify `preHandlerHookHandler`.
  - Extract the `cookie` header from `request.headers.cookie`, call `getSession(cookieHeader)`, validate the returned session object with `requestSessionSchema.safeParse(...)` from `@shared/http/session.schema.js`, and attach **only** `request.session` on success.
  - Throw `new AppError(401, "UNAUTHORIZED", "Authentication required.")` if the cookie is missing, invalid, or fails `requestSessionSchema` validation.
- [x] Create unit tests:
  - `tests/modules/authentication/auth.client.unit.test.ts`: Verify `normalizeCrossSiteCookies` upgrades/sets `SameSite=None`, `Secure`, `HttpOnly`, and `Path=/` without duplicating attributes.
  - `tests/modules/authentication/auth.guard.unit.test.ts`: Verify `requireAuth` populates `request.session` on a valid session and throws `401 UNAUTHORIZED` when cookie is missing, session is null, or session payload fails `requestSessionSchema`.
- [x] Mark all Sprint 12 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add PLAN.md src/modules/authentication/auth.client.ts src/modules/authentication/auth.guard.ts tests/modules/authentication/
git commit -m "feat(authentication): add neon auth client adapter, session-only requireAuth guard, and unit tests"
```

---

## Sprint 13: Auth Service Layer (All 10 Operations)
**Upstream integration note:** The installed SDK maps OTP reset to a different endpoint; the adapter calls Better Auth’s `/email-otp/reset-password` endpoint directly. Automatic login after verification requires upstream `autoSignInAfterVerification`; the service fails closed if no session cookie is returned. Password reset signs in with the new password and explicitly revokes all sessions; if sign-in or revocation fails, the password may already have changed and the operation reports failure.


**Goal:** Implement the isolated business logic layer for all 10 authentication operations using the `AuthClient` adapter and `mapAuthError()`.

### Tasks
- [x] Create `src/modules/authentication/auth.service.ts`:
  - Export `createAuthService(authClient: AuthClient)` implementing:
    1. `register({ username, email, password })`: Creates unverified account via Neon's native flow and triggers verification code email. Does not return a session cookie.
    2. `verifyEmail({ email, code })`: Verifies the email OTP and returns `{ user, setCookies }` (normalized cross-site cookies) to log the user in automatically.
    3. `resendVerification({ email })`: Triggers a fresh verification code; swallows user-not-found errors to prevent account enumeration.
    4. `login({ email, password })`: Authenticates credentials, rejects unverified accounts with `EMAIL_NOT_VERIFIED`, and returns `{ user, setCookies }`.
    5. `logout(cookieHeader)`: Revokes the current session and returns cookie-clearing `setCookies`.
    6. `logoutAll(cookieHeader)`: Revokes all active sessions for the user and returns cookie-clearing `setCookies`.
    7. `getSession(cookieHeader)`: Validates the session cookie and returns `RequestSession | null` (used by `requireAuth`).
    8. `getMe(cookieHeader)`: Fetches the full `AuthUser` profile for the authenticated caller (used exclusively by `GET /api/v1/auth/me`).
    9. `forgotPassword({ email })`: Sends password reset code; swallows user-not-found errors to prevent account enumeration.
    10. `resetPassword({ email, code, newPassword })`: Verifies reset code, updates password, **revokes all active sessions**, and returns cookie-clearing `setCookies`.
    11. `changePassword(cookieHeader, { currentPassword, newPassword })`: Verifies current password, updates password with `revokeOtherSessions: true`, and returns success.
  - Wrap all `authClient` calls in `try/catch` routing errors through `mapAuthError()`.
- [x] Create unit tests:
  - `tests/modules/authentication/auth.service.unit.test.ts`: Test all service methods with a mocked `AuthClient`, explicitly verifying:
    - Auto-login `setCookies` forwarding on `verifyEmail`.
    - Unverified account rejection (`403 EMAIL_NOT_VERIFIED`) on `login`.
    - Anti-enumeration (generic success) on `resendVerification` and `forgotPassword` when user does not exist.
    - Full session revocation on `resetPassword` and `logoutAll`, and `revokeOtherSessions: true` on `changePassword`.
    - Clean separation between `getSession` (`RequestSession`) and `getMe` (`AuthUser`).
- [x] Mark all Sprint 13 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add PLAN.md src/modules/authentication/auth.service.ts tests/modules/authentication/auth.service.unit.test.ts
git commit -m "feat(authentication): implement auth service for all 10 operations and unit tests"
```

---

## Sprint 14: Auth Routes, Two-Stage Rate Limiting, Plugin Registration & Integration Tests

**Goal:** Expose all 10 typed `/api/v1/auth/*` endpoints with public (`onRequest` IP) and protected (`preHandler` `request.session.userId`) rate limiting, register the plugin in `src/app.ts`, and verify end-to-end HTTP, CORS, and cookie behavior.

### Tasks
- [x] Create `src/modules/authentication/auth.routes.ts`:
  - Register all 10 routes under `/api/v1/auth` with Zod request/response schemas and OpenAPI tags (`["Authentication"]`):
    - **Public — Email-Trigger Tier (`config: { rateLimit: AUTH_RATE_LIMITS.emailTrigger }`):**
      - `POST /register` (`201`)
      - `POST /resend-verification` (`200`)
      - `POST /forgot-password` (`200`)
    - **Public — Brute-Force Tier (`config: { rateLimit: AUTH_RATE_LIMITS.bruteForce }`):**
      - `POST /login` (`200`, forwards `Set-Cookie`)
      - `POST /verify-email` (`200`, forwards `Set-Cookie` for auto-login)
      - `POST /reset-password` (`200`, forwards cookie-clearing `Set-Cookie`)
    - **Protected — Standard (`preHandler: [app.requireAuth]`, inherits global `100/1m`):**
      - `GET /me` (`200`, calls `authService.getMe(request.headers.cookie)`)
      - `POST /logout` (`200`, forwards cookie-clearing `Set-Cookie`)
    - **Protected — Two-Stage Per-User Limit (`preHandler: [app.requireAuth, app.rateLimit(AUTH_RATE_LIMITS.sensitiveUserAction)]`):**
      - `POST /change-password` (`200`)
      - `POST /logout-all` (`200`, forwards cookie-clearing `Set-Cookie`)
- [x] Create `src/modules/authentication/auth.plugin.ts`:
  - Export `authenticationPlugin` (`fastify-plugin` / `fp`) accepting optional `{ authClient?: AuthClient }` for testing.
  - Decorate **only** `request.session = null` and `app.requireAuth = createRequireAuth(authService.getSession)` (no `request.user`).
  - Register `authRoutes` with prefix `"/api/v1/auth"`.
- [x] Update `src/app.ts`:
  - Register `authenticationPlugin` after `rateLimitPlugin` and `databasePlugin`.
- [x] Create integration tests:
  - `tests/modules/authentication/auth.routes.integration.test.ts`:
    - Verify `POST /api/v1/auth/register` rejects passwords under 12 chars with `422 VALIDATION_ERROR` and succeeds (`201`) with valid input.
    - Verify `POST /api/v1/auth/verify-email` returns `200` and sets cross-site `Set-Cookie` (`SameSite=None; Secure; HttpOnly`).
    - Verify `GET /api/v1/auth/me` returns `401 UNAUTHORIZED` without a cookie and `200` with `AuthUser` on a valid mocked session.
    - Verify `POST /api/v1/auth/reset-password`, `POST /api/v1/auth/change-password`, and `POST /api/v1/auth/logout-all` trigger session revocation and appropriate `Set-Cookie` clearing.
    - Verify two-stage rate limiting on `POST /api/v1/auth/change-password` (keys by `request.session.userId` after `requireAuth`).
    - Verify CORS headers (`Access-Control-Allow-Origin: CLIENT_ORIGIN`, `Access-Control-Allow-Credentials: true`) on auth routes.
- [x] Mark all Sprint 14 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add PLAN.md src/modules/authentication/auth.routes.ts src/modules/authentication/auth.plugin.ts src/app.ts tests/modules/authentication/
git commit -m "feat(authentication): mount v1 auth routes with two-stage rate limits, cors cookies, and integration tests"
```