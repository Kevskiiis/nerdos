## Sprint: Password Schema Hardening & Validation Tests

**Goal:** Split and harden password validation in `src/modules/authentication/auth.schemas.ts` (`newPasswordSchema` vs. `existingPasswordSchema`) so malformed payloads fail fast at the Fastify boundary before hitting Neon Auth, while keeping `/login` decoupled for future password-policy upgrades. Leave `emailSchema`, `usernameSchema`, and `otpCodeSchema` untouched in this sprint.

### Tasks

#### 1. Update Password Schemas (`src/modules/authentication/auth.schemas.ts`)
- [x] Replace the single `passwordSchema` with two distinct exported schemas (each with a concise 1–2 sentence JSDoc comment):
  - `newPasswordSchema`:
    - `z.string().min(12, "Password must be at least 12 characters.").max(128, "Password must be at most 128 characters.")`
    - `.regex(/^[\x20-\x7E]+$/, "Password may only contain letters, numbers, spaces, and standard special characters.")`
    - `.refine((val) => val.trim().length > 0, "Password cannot be blank.")`
  - `existingPasswordSchema`:
    - `z.string().min(1).max(128)` (allows legacy/shorter passwords on login and re-authentication so future policy upgrades never lock out existing users).
- [x] Wire the split schemas into the existing request body schemas:
  - `registerBodySchema.password` -> `newPasswordSchema`
  - `resetPasswordBodySchema.newPassword` -> `newPasswordSchema`
  - `changePasswordBodySchema.newPassword` -> `newPasswordSchema`
  - `loginBodySchema.password` -> `existingPasswordSchema`
  - `changePasswordBodySchema.currentPassword` -> `existingPasswordSchema`
- [x] Add a cross-field `.refine()` on `changePasswordBodySchema` rejecting `data.newPassword === data.currentPassword` with `{ message: "New password must be different from current password.", path: ["newPassword"] }`.

#### 2. Unit Tests (`tests/modules/authentication/auth.schemas.unit.test.ts`)
- [x] **`newPasswordSchema` boundaries:**
  - Rejects 11 characters (under minimum) and 129 characters (over maximum).
  - Accepts exact boundaries: 12 characters and 128 characters.
- [x] **`newPasswordSchema` character set:**
  - Accepts lowercase-only passphrases with spaces (e.g., `"coffee river blanket"`).
  - Accepts numbers and standard printable ASCII symbols (`!@#$%^&*()-_=+[]{}|;:'",.<>?/\`~`).
  - Rejects whitespace-only strings (e.g., `"            "`).
  - Rejects ASCII control characters (`\n`, `\r`, `\t`, `\0`, `\x7F`).
  - Rejects non-ASCII and emoji characters (e.g., `"password1234🔥"`, `"pássword1234"`).
- [x] **`existingPasswordSchema`:**
  - Accepts legacy short passwords (e.g., `"short8ch"`).
  - Rejects empty string `""` and strings longer than 128 characters.
- [x] **`changePasswordBodySchema` cross-field check:**
  - Rejects when `newPassword` equals `currentPassword` and reports the error on `path: ["newPassword"]`.
  - Accepts when `currentPassword` is a valid legacy password (e.g., 8 chars) and `newPassword` is a different valid 12+ char password.

#### 3. Integration Tests (`tests/modules/authentication/auth.routes.integration.test.ts`)
- [x] **Fail-fast edge rejection (upstream protection):** Using a spied/mocked `authClient`, verify that invalid `newPassword` payloads (11 chars, 129 chars, all-spaces, control chars, emoji/non-ASCII) on `POST /api/v1/auth/register`, `POST /api/v1/auth/reset-password`, and `POST /api/v1/auth/change-password` return `422 VALIDATION_ERROR` matching `errorResponseSchema` **and the corresponding password operation is called 0 times** (the protected change-password route first checks the session)..
- [x] **Forward-compatible login:** Verify `POST /api/v1/auth/login` accepts a legacy 8-character password and forwards it to `authClient.signIn`.
- [x] **Same-password guard:** Verify `POST /api/v1/auth/change-password` rejects identical `currentPassword` and `newPassword` with `422 VALIDATION_ERROR` **and `authClient.changePassword` is called 0 times**.
- [x] Mark all tasks in this sprint as `[x]` in `PLAN.md`.

### Verification & Local Commit
```bash
pnpm exec tsc --noEmit && pnpm test
git add PLAN.md src/modules/authentication/auth.schemas.ts tests/modules/authentication/
git commit -m "feat(authentication): harden password schemas with unit and integration tests"
```