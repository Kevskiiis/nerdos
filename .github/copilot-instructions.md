# Nerdos Repository Instructions

## 1. Project Overview & Structure
Nerdos is a student study platform structured as a monorepo:
- `nerdos-web/`: Mobile-first React SPA (TypeScript, Tailwind CSS, shadcn/ui, Plate editor).
- `nerdos-api/`: Modular monolith FastAPI API backed by Supabase (Auth, Postgres, Storage).

## 2. Tooling & Commands
- **Backend package manager:** Use `uv` exclusively (`uv add`, `uv run pytest`, `uv run ruff check .`). Never suggest `pip`, `poetry`, or `python -m`.
- **Frontend package manager:** Use `npm` (or `pnpm`) inside `nerdos-web/`.
- **Verification:** Before finishing any task, ensure linting and tests pass:
  - Backend: `uv run ruff check . && uv run pytest`
  - Frontend: `npm run lint && npm run build`

## 3. Architecture & Module Boundaries
- **Backend Modular Monolith:** Organize domain features under `nerdos-api/app/modules/<domain>/` using `router.py`, `service.py`, `repository.py`, and `schemas.py`.
- **Strict Isolation:** Modules must never import another module's `repository.py` or query its database tables directly. Cross-module calls must go through public functions in `service.py`.
- **Single App Instance:** Register each module's `APIRouter` in `nerdos-api/app/main.py`; do not create secondary `FastAPI()` instances.

## 4. Environment Variables
- **Backend:** Load all configuration and secrets (API keys, JWT secrets, Supabase `service_role` keys) through a centralized Pydantic `BaseSettings` class (`pydantic-settings`) rather than calling `os.getenv()` directly. Wrap sensitive values in `SecretStr` so secrets cannot leak into logs.
- **Frontend:** Expose only public, non-sensitive environment variables (such as public API URLs and Supabase anon keys) using your bundler's public prefix. Never reference backend secrets or `service_role` keys in frontend code.
- **Agent File Access & Git Safety:** Never read, reference, print, or edit `.env` files. When adding or updating environment variables, document placeholder keys exclusively in `.env.example` and verify that `.env` remains excluded in `.gitignore`.

## 5. Agent API Skills
- When working in `nerdos-api/`, always inspect and use the relevant installed skill for the task.
- Use `nerdos-api/.agents/skills/fastapi/` for FastAPI routing, Pydantic models, dependency injection, middleware, streaming responses, and Python API conventions.
- Use `nerdos-api/.agents/skills/supabase/` for Supabase Auth, Storage, Row-Level Security, Edge Functions, and Supabase client/service-role integration.
- Use `nerdos-api/.agents/skills/supabase-postgres-best-practices/` for Postgres schema design, migrations, indexes, RLS policies, query performance, and database-safe implementation patterns.
- Apply these skills before editing backend code and follow their guidance alongside the repository instructions above.