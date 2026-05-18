# AGENTS

This repository ships a curated **project context** for AI coding agents.

## Required reading (load before any change)

- [`_bmad-output/project-context.md`](./_bmad-output/project-context.md) — the canonical "rules of the road" (technology stack with exact versions, language rules, framework patterns, testing conventions, workflow rules, and critical don't-miss anti-patterns). Optimized for LLM context.

## Authoritative companion documentation

Long-form references live under [`docs/`](./docs/). Start with:

- [`docs/index.md`](./docs/index.md) — documentation map
- [`docs/project-overview.md`](./docs/project-overview.md) — executive summary
- [`docs/architecture-web.md`](./docs/architecture-web.md) / [`docs/architecture-backend.md`](./docs/architecture-backend.md) / [`docs/integration-architecture.md`](./docs/integration-architecture.md)
- [`docs/api-contracts-backend.md`](./docs/api-contracts-backend.md) / [`docs/data-models-backend.md`](./docs/data-models-backend.md)
- [`docs/development-guide-web.md`](./docs/development-guide-web.md) / [`docs/development-guide-backend.md`](./docs/development-guide-backend.md)
- [`docs/deployment-guide.md`](./docs/deployment-guide.md) / [`docs/component-inventory-web.md`](./docs/component-inventory-web.md) / [`docs/source-tree-analysis.md`](./docs/source-tree-analysis.md)
- [`app-backend/docs/API_CONSUMER_GUIDE.md`](./app-backend/docs/API_CONSUMER_GUIDE.md) — authoritative API consumer narrative

## Working agreement

- Follow ALL rules in `_bmad-output/project-context.md` exactly as documented. When two rules appear to conflict, prefer the more restrictive option and surface the conflict.
- Cross-check architectural questions against the long-form docs above before deviating from any documented pattern.
- When you introduce a new convention, anti-pattern, or version pin, propose updating `_bmad-output/project-context.md` in the same change.
- Don't bypass the pre-commit hook (`.husky/pre-commit` runs `pnpm lint`).

## Repo-level entry points

- **Monorepo:** pnpm + Turborepo; two workspaces: `app-web/` (Next.js 15 + React 19) and `app-backend/` (NestJS 11 + Prisma 7 + PostgreSQL 18).
- **Common commands** (always from repo root): `pnpm install`, `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, `docker compose up -d` (local Postgres on host port 5439).

_Project context regenerated via the BMad `bmad-generate-project-context` workflow._
