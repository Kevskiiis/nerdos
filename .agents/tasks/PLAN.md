# Nerdos Web — Auth, Centralized API Layer & README Showcase Plan

This plan introduces a centralized `ky` HTTP client, a single source of truth for API endpoints, mobile-first **Signup** and **Login** pages, and a professional `README.md` UI showcase backed by Playwright MCP screenshots.

## Core Engineering Pillars (Enforce Across Every Sprint)

1. **Scalability:**
   - Centralize all HTTP configuration in `src/lib/api-client.ts` and all backend route paths in `src/config/api-endpoints.ts`. Feature modules must never hardcode URLs or instantiate their own HTTP clients.
   - Keep `src/features/auth/` strictly isolated from `dashboard/`, `library/`, and `landing/`.
2. **Maintainability & Clean Code:**
   - Execute **one sprint per session**; never scaffold future sprints.
   - Keep components small, single-responsibility, and typed end-to-end with TypeScript and Zod.
   - Add a concise 1–2 sentence JSDoc comment (`/** ... */`) above every exported component, hook, schema, and helper function.
   - Use existing Tailwind/shadcn semantic tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`)—no ad-hoc hex colors.
3. **Security Best Practices:**
   - Send cross-site session cookies securely via `credentials: "include"`—never store session tokens in `localStorage` or `sessionStorage`.
   - Never log passwords, tokens, or raw auth payloads to the console.
   - Mirror backend Zod validation on the client for instant feedback while keeping `/login` password validation loose (`min(1).max(128)`) for forward-compatibility.
   - Never expose raw stack traces or internal server details in UI error banners.
4. **Reliability:**
   - Configure `ky` with strict timeouts (`10_000ms`) and `retry: 0` on mutations so auth requests fail fast and never double-submit.
   - Normalize all HTTP, timeout, and network failures through a single `parseApiError()` utility so every UI screen handles errors predictably.
   - Verify every sprint with `pnpm exec tsc --noEmit && pnpm run build` and Playwright MCP before committing.
5. **Progress Tracking & Git Hygiene:**
   - Mark completed tasks as `[x]` in `PLAN.md` and include `PLAN.md` in each sprint's **local git commit**. **Never run `git push`.**

---

## Sprint 6: Centralized `ky` API Client & Endpoint Registry

**Goal:** Install `ky`, build a resilient, security-hardened API client configured for `nerdos-api` session cookies, and centralize all backend endpoints in one file so future route changes require a single edit.

### Tasks
- [x] Install `ky`: `pnpm add ky`.
- [x] Create/update `src/config/env.ts` (and `.env.example`):
  - Validate `VITE_API_BASE_URL` (e.g., `http://localhost:3000`) at startup using Zod, failing fast if missing or malformed, and strip any trailing slash.
- [x] Create `src/config/api-endpoints.ts`:
  - Export a frozen `API_ENDPOINTS` registry (`as const`) grouped by domain with **no leading slashes** (required by ky's prefix handling):
    ```ts
    export const API_ENDPOINTS = {
      auth: {
        register: "api/v1/auth/register",
        login: "api/v1/auth/login",
        verifyEmail: "api/v1/auth/verify-email",
        resendVerification: "api/v1/auth/resend-verification",
        logout: "api/v1/auth/logout",
        logoutAll: "api/v1/auth/logout-all",
        me: "api/v1/auth/me",
        forgotPassword: "api/v1/auth/forgot-password",
        resetPassword: "api/v1/auth/reset-password",
        changePassword: "api/v1/auth/change-password",
      },
    } as const;
    ```
- [x] Create `src/lib/api-client.ts`:
  - Export `apiClient = ky.create({ ... })` configured with:
    - `prefix: env.VITE_API_BASE_URL` (ky 2.x option)
    - `credentials: "include"` (for `HttpOnly; Secure; SameSite=None` session cookies)
    - `timeout: 10_000`
    - `retry: 0` (fail fast; prevents duplicate auth submissions)
    - Default `Accept: "application/json"` header.
  - Export a typed `ApiError` class and `parseApiError(error: unknown): Promise<ApiError>` helper that safely extracts `nerdos-api`'s error contract (`code`, `message`, `retryable`, `details`) from `HTTPError` responses, with safe fallbacks for `TimeoutError` and offline/network errors.
- [x] Mark all Sprint 6 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm run build
git add package.json pnpm-lock.yaml .env.example PLAN.md src/config/ src/lib/api-client.ts
git commit -m "feat(api): add centralized ky client, endpoint registry, and error parser"
```

---

## Sprint 7: Auth API Module, Validation Schemas & Mobile-First Signup / Login Pages

**Goal:** Build the isolated `src/features/auth/` API layer, frontend Zod schemas, and clean, mobile-first **Signup** (`/register`) and **Login** (`/login`) pages using `shadcn/ui`, verified in Playwright MCP.

### Tasks

#### 1. Auth API & Validation Schemas (`src/features/auth/`)
- [ ] Create directories if missing: `mkdir -p src/features/auth/api src/features/auth/components src/features/auth/lib src/features/auth/pages`.
- [ ] Create `src/features/auth/api/auth.api.ts`:
  - Export typed functions (`registerUser`, `loginUser`, `getCurrentUser`) using `apiClient` from `@/lib/api-client` and `API_ENDPOINTS.auth.*` from `@/config/api-endpoints`.
  - Route all caught errors through `parseApiError()` so UI components always receive a clean, predictable `ApiError`.
- [ ] Create `src/features/auth/lib/auth.schemas.ts`:
  - Mirror `nerdos-api`'s validation rules cleanly:
    - `emailSchema`: trimmed, lowercased, max 254 chars, valid email.
    - `usernameSchema`: trimmed, 3–32 chars.
    - `newPasswordSchema` (for **Signup**): 12–128 printable ASCII characters (`/^[\x20-\x7E]+$/`), non-blank.
    - `existingPasswordSchema` (for **Login**): `z.string().min(1, "Password is required.").max(128)` (loose for forward-compatibility).
    - `signupFormSchema` (`username`, `email`, `password`) and `loginFormSchema` (`email`, `password`).

#### 2. Mobile-First Auth Shell & Pages (`src/features/auth/`)
- [ ] Use `shadcn` MCP to verify/install `card`, `input`, `label`, `button`, and `alert` in `src/components/ui/`.
- [ ] Create `src/features/auth/components/AuthCardLayout.tsx`:
  - Centered, distraction-free mobile-first layout (`min-h-dvh flex flex-col items-center justify-center px-4 py-8`) with the Nerdos wordmark + `Beta` badge linking back to `/`, and a responsive `<Card className="w-full max-w-md">`.
- [ ] Create `src/features/auth/pages/SignupPage.tsx` (`/register`):
  - Accessible form fields for `Username`, `Email`, and `Password` (with show/hide toggle, `autoComplete` attributes, `text-base` to prevent iOS Safari auto-zoom, and a subtle *"At least 12 characters"* helper note).
  - Full-width submit button (`min-h-[44px]`) with loading/disabled state to prevent double submissions.
  - Map `ApiError` codes cleanly into user-friendly `<Alert variant="destructive">` messages (`EMAIL_ALREADY_EXISTS`, `VALIDATION_ERROR`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`).
  - On `201` success, navigate to `/verify-email` (passing only the registered `email` in route state—never the password).
  - Footer link: *"Already have an account? Log in"* -> `/login`.
- [ ] Create `src/features/auth/pages/LoginPage.tsx` (`/login`):
  - Accessible form fields for `Email` and `Password` (with show/hide toggle, `autoComplete="current-password"`, and a `"Forgot password?"` link to `/forgot-password`).
  - Full-width submit button (`min-h-[44px]`) with loading/disabled state.
  - Map `ApiError` codes cleanly (`INVALID_CREDENTIALS`, `EMAIL_NOT_VERIFIED` with a direct link to `/verify-email`, `RATE_LIMITED`, `SERVICE_UNAVAILABLE`).
  - On `200` success, refresh auth session state and navigate to `/dashboard`.
  - Footer link: *"New to Nerdos? Create an account"* -> `/register`.
- [ ] Wire `LoginPage` (`/login`) and `SignupPage` (`/register`) into the **Guest-Only Auth** route group in `src/app/`.

#### 3. Verification (Playwright MCP + Typecheck & Build)
- [ ] Run `pnpm exec tsc --noEmit && pnpm run build` and confirm zero errors.
- [ ] Open `/register` and `/login` in **Playwright MCP** at **mobile (`375×812`)** and **desktop (`1440×900`)**:
  - Confirm zero console errors and zero horizontal overflow on mobile.
  - Verify client-side validation blocks empty submissions and 11-character passwords on `/register` with clear inline errors and zero network calls.
  - Verify password show/hide toggle and navigation links between `/`, `/login`, and `/register`.
- [ ] Mark all Sprint 7 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm run build
git add PLAN.md src/features/auth/ src/components/ui/ src/app/
git commit -m "feat(auth): add ky auth API layer, schemas, and mobile-first signup and login pages"
```

---

## Sprint 8: Playwright MCP UI Snapshots & Professional `README.md` Showcase

**Goal:** Capture clean, high-resolution UI screenshots of the new Landing, Signup, and Login pages using Playwright MCP, save them alongside the existing snapshots referenced in the root `README.md`, and upgrade `README.md` to showcase the app like a polished, production open-source repository.

### Tasks
- [ ] Inspect the root `README.md` to locate the exact directory and naming convention used for existing UI snapshots/screenshots.
- [ ] Start the local `nerdos-web` dev server and use **Playwright MCP** (`browser_take_screenshot`) to capture clean, consistent screenshots saved directly into that existing snapshot directory:
  - **Landing Page (`/`):** Desktop (`1440×900`, showing the Hero + interactive flashcard and/or full-page preview) and Mobile (`375×812`).
  - **Note Demo Section (`/`):** Scrolled into view showing the live Plate rich-text editor demo.
  - **Signup Page (`/register`):** Clean desktop (`1440×900`) or mobile (`375×812`) view.
  - **Login Page (`/login`):** Clean desktop (`1440×900`) or mobile (`375×812`) view.
- [ ] Verify every saved image opens cleanly, has no broken assets or console error overlays, and uses consistent filenames matching the repo's existing convention.
- [ ] Update the root `README.md` to present the new UI professionally (matching high-star open-source repos):
  - Preserve existing project setup, tech stack, and architecture sections while keeping them crisp and accurate (including `ky`, `shadcn/ui`, `Plate`, and centralized API endpoints).
  - Add/update a dedicated **Screenshots / UI Showcase** section using clean Markdown tables or `<p align="center">` layouts with descriptive `alt` text and captions so desktop and mobile views sit neatly side-by-side without overwhelming the page.
  - Ensure all relative image paths in `README.md` resolve accurately to the saved snapshot files.
- [ ] Mark all Sprint 8 tasks as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm run build
git add PLAN.md README.md <existing-snapshot-directory>/
git commit -m "docs(readme): add Playwright UI snapshots and showcase landing, signup, and login views"
```
