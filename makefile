.DEFAULT_GOAL := help
SHELL := /bin/bash

.PHONY: help install install-backend install-frontend dev dev-backend dev-frontend \
        build build-backend build-frontend backend frontend test test-backend \
        lint lint-frontend typecheck typecheck-backend typecheck-frontend \
        services-setup services-up services-down services-logs

# Support both "make build-frontend" and "make build frontend".
build_selection := $(filter frontend backend,$(MAKECMDGOALS))

help: ## Show available commands.
	@awk 'BEGIN {FS = ":.*## "; print "Usage: make <command>\n"} /^[a-zA-Z_-]+:.*## / {printf "  %-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)
	@printf '\n  %-22s %s\n' 'build frontend' 'Build only the frontend (also: build-frontend).' 'build backend' 'Build only the backend (also: build-backend).'

install: install-backend install-frontend ## Install dependencies for both apps.
install-backend: ## Install backend dependencies.
	cd nerdos-api && pnpm install --frozen-lockfile
install-frontend: ## Install frontend dependencies.
	cd nerdos-web && npm ci

dev: ## Run backend and frontend together; Ctrl-C stops both.
	@set -m; \
	  $(MAKE) --no-print-directory dev-backend & backend_pid=$$!; \
	  $(MAKE) --no-print-directory dev-frontend & frontend_pid=$$!; \
	  trap 'kill -- -$$backend_pid -$$frontend_pid 2>/dev/null || true; wait 2>/dev/null || true' EXIT; \
	  trap 'exit 130' INT; trap 'exit 143' TERM; \
	  wait -n $$backend_pid $$frontend_pid

dev-backend: ## Run the API, loading nerdos-api/.env when present.
	@cd nerdos-api && set -a && if [[ -f .env ]]; then source .env; fi && set +a && \
	  if [[ "$${REDIS_URL:-}" =~ ^rediss://nerdos:[^@]*@127\.0\.0\.1:6380/?$$ ]]; then \
	    if [[ ! -f dev/redis/.env || ! -f dev/redis/certs/redis.crt ]]; then echo 'Local Redis is not set up. Run make services-setup first.' >&2; exit 1; fi; \
	    source dev/redis/.env; export REDIS_URL="rediss://nerdos:$${REDIS_PASSWORD}@127.0.0.1:6380"; \
	    if [[ -z "$${REDIS_CA_CERT:-}" ]]; then export REDIS_CA_CERT="$$(cat dev/redis/certs/redis.crt)"; fi; \
	  fi && \
	  exec pnpm dev

dev-frontend: ## Run the frontend development server.
	cd nerdos-web && npm run dev

build: $(if $(build_selection),$(addprefix build-,$(build_selection)),build-backend build-frontend) ## Build both apps (or specify frontend/backend).
backend frontend: ; @: # Selectors for "make build backend/frontend".
build-backend: ## Build the backend.
	cd nerdos-api && pnpm run build
build-frontend: ## Build the frontend.
	cd nerdos-web && npm run build

test: test-backend ## Run available automated tests.
test-backend: ## Run backend tests.
	cd nerdos-api && pnpm test
lint: lint-frontend ## Run available lint checks.
lint-frontend: ## Lint the frontend.
	cd nerdos-web && npm run lint
typecheck: typecheck-backend typecheck-frontend ## Type-check both apps.
typecheck-backend: ## Type-check the backend.
	cd nerdos-api && pnpm exec tsc --noEmit
typecheck-frontend: ## Type-check the frontend.
	cd nerdos-web && npm run typecheck

services-setup: ## Generate local Redis credentials and TLS files, preserving existing values.
	./nerdos-api/dev/redis/setup-redis-tls.sh

services-up: services-setup ## Set up and start development services.
	docker compose -f nerdos-api/dev/dev-compose.yaml up -d
services-down: ## Stop development services, retaining their data.
	docker compose -f nerdos-api/dev/dev-compose.yaml down
services-logs: ## Follow development service logs.
	docker compose -f nerdos-api/dev/dev-compose.yaml logs -f
