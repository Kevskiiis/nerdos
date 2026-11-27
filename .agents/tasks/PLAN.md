# Task: Harden `otpCodeSchema` to 6-Digit Numeric Validation + Tests

## Objective
Update `otpCodeSchema` in the authentication schemas to strictly enforce Neon Auth's 6-digit numeric OTP format with user-friendly Zod validation messages. Add and update unit and integration tests for all affected endpoints and fixtures.

## 1. Schema Update
Update `otpCodeSchema` in the authentication schemas file while keeping the one-sentence JSDoc comment:

```ts
/** Normalizes and validates a 6-digit one-time verification code. */
export const otpCodeSchema = z.string({ error: 'Enter the verification code.' })
  .trim()
  .min(1, 'Enter the verification code.')
  .regex(/^\d+$/, 'Verification code must contain only numbers.')
  .length(6, 'Verification code must be 6 digits.');
```

- Limit schema changes strictly to `otpCodeSchema`. Do **not** modify unrelated schemas.

## 2. Unit Tests
Add/update unit tests targeting `otpCodeSchema` directly:

- **Valid & normalized:**
  - Standard 6-digit code (`'123456'`) passes.
  - Preserves leading zeros (`'004219'` -> `'004219'`).
  - Trims surrounding whitespace (`'  123456  '` -> `'123456'`).
- **Missing / non-string input:**
  - `undefined`, `null`, numbers (`123456`), or objects fail with `'Enter the verification code.'`.
- **Empty / whitespace-only:**
  - `''` and `'   '` fail with `'Enter the verification code.'`.
- **Non-numeric characters:**
  - Letters (`'12345a'`, `'abcdef'`), spaces inside (`'123 456'`), hyphens (`'123-456'`), symbols, or Unicode digits fail with `'Verification code must contain only numbers.'`.
- **Length boundaries (post-trim, numeric-only):**
  - 5 digits (`'12345'`) and padded short strings (`'  12345  '`) fail with `'Verification code must be 6 digits.'`.
  - 7 digits (`'1234567'`) fails with `'Verification code must be 6 digits.'`.

## 3. Integration Tests
Add/update integration tests for endpoints backed by `otpCodeSchema` (`verify-email` and `reset-password`) to verify the API's standard validation error contract:

- Missing or blank `code` -> returns HTTP 400 with `'Enter the verification code.'`.
- Non-numeric `code` (e.g., `'12ab56'`, `'123-456'`) -> returns HTTP 400 with `'Verification code must contain only numbers.'`.
- Wrong length numeric `code` (`'12345'` or `'1234567'`) -> returns HTTP 400 with `'Verification code must be 6 digits.'`.
- Valid 6-digit `code` with surrounding whitespace (e.g., `' 012345 '`) -> accepted and normalized before reaching the service/provider layer.

## 4. Fixture Audit & Verification
- Audit existing authentication unit and integration tests (and mocks/fixtures) for any placeholder OTP codes that are not 6 numeric digits (e.g., `'1234'` or `'ABCDEF'`) and update them to valid 6-digit numeric strings.
- Run the full authentication unit and integration test suites and confirm all tests pass with zero regressions.