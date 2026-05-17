# Vendlyhub Documentation Index

**Type:** Monorepo with 2 parts (`app-web`, `app-backend`)
**Primary Language:** TypeScript
**Architecture:** Decoupled SPA + REST API (Next.js 15 / React 19 client; NestJS 11 + Prisma 7 + PostgreSQL backend)
**Last Updated:** 2026-05-16

## Project Overview

Vendlyhub is a SaaS platform for small establishments (restaurants, pizzarias, etc.) to onboard, manage their catalog (categories and products with images), and receive orders from a public storefront (`/catalog/[slug]`). It is delivered as two cooperating apps in one repository — a Next.js admin + storefront UI and a NestJS REST API backed by PostgreSQL.

## Project Structure

This project consists of 2 parts:

### Vendlyhub Web (`web`)

- **Type:** web (Next.js)
- **Location:** `app-web/`
- **Tech Stack:** Next.js 15.2.8, React 19, TypeScript 5, Axios, react-hook-form + zod, SASS modules, next-themes, lucide-react, recharts, sonner, firebase
- **Entry Point:** `app-web/src/app/layout.tsx` + `app-web/src/middleware.ts`

### Vendlyhub Backend (`backend`)

- **Type:** backend (NestJS)
- **Location:** `app-backend/`
- **Tech Stack:** NestJS 11, Express 5, Prisma 7, PostgreSQL 18, JWT + Passport (local, JWT, optional Google OAuth), bcrypt, multer, nodemailer, Swagger/OpenAPI, Jest
- **Entry Point:** `app-backend/src/main.ts`

## Cross-Part Integration

Web → Backend over HTTPS/JSON (Axios `apiClient`) using JWT access tokens (1h) + UUID refresh tokens (7d, hashed server-side). Static uploads (logos, avatars, product images) are served at `/uploads/...` by raw Express middleware mounted before NestJS. See [integration-architecture.md](./integration-architecture.md).

## Quick Reference

### Web Quick Ref

- **Stack:** Next.js 15 (App Router) + React 19 + TypeScript
- **Entry:** `app-web/src/app/layout.tsx` (+ `middleware.ts` edge gate)
- **Pattern:** App Router with conditional shell + edge auth gating + central Axios `apiClient`

### Backend Quick Ref

- **Stack:** NestJS 11 + Express 5 + Prisma 7 + PostgreSQL 18
- **Entry:** `app-backend/src/main.ts`
- **Pattern:** Modular monolith (controllers → use-cases / services → repositories → Prisma). Two surfaces: authenticated admin and public catalog.

## Generated Documentation

### Core Documentation

- [Project Overview](./project-overview.md) — Executive summary and high-level architecture
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory structure for both apps
- [Integration Architecture](./integration-architecture.md) — How `app-web` talks to `app-backend`
- [Deployment Guide](./deployment-guide.md) — Local infra and production expectations

### Part-Specific Documentation

#### Vendlyhub Web (`web`)

- [Architecture](./architecture-web.md) — Technical architecture for `app-web`
- [Component Inventory](./component-inventory-web.md) — UI component catalog + services + hooks + lib
- [Development Guide](./development-guide-web.md) — Setup and development workflow

#### Vendlyhub Backend (`backend`)

- [Architecture](./architecture-backend.md) — Technical architecture for `app-backend`
- [Development Guide](./development-guide-backend.md) — Setup, testing, Prisma, conventions
- [API Contracts](./api-contracts-backend.md) — Endpoint catalog (paired with the existing API consumer guide)
- [Data Models](./data-models-backend.md) — Prisma schema, enums, indexes, migrations

### Machine-Readable Metadata

- [Project Parts](./project-parts.json) — Structured metadata about parts and integrations
- [Project Scan Report](./project-scan-report.json) — Workflow state file

## Existing Documentation (in the repo)

- [README.md](../README.md) — Monorepo quickstart
- [app-web/README.md](../app-web/README.md) — Default Next.js README
- [app-backend/README.md](../app-backend/README.md) — Backend description with pointers to API guide
- [app-backend/docs/API_CONSUMER_GUIDE.md](../app-backend/docs/API_CONSUMER_GUIDE.md) — Authoritative narrative for the public API (auth, products, etc.)
- [app-backend/docs/modules/README.md](../app-backend/docs/modules/README.md) — Module-by-module narrative
  - [users.md](../app-backend/docs/modules/users.md), [sessions.md](../app-backend/docs/modules/sessions.md), [establishments.md](../app-backend/docs/modules/establishments.md), [addresses.md](../app-backend/docs/modules/addresses.md), [contacts.md](../app-backend/docs/modules/contacts.md), [products.md](../app-backend/docs/modules/products.md)

## Getting Started

### Prerequisites

- Node.js **24.13.0** (root `.nvmrc`)
- pnpm **10.27.0**
- Docker (for the local PostgreSQL container)

### Setup

```bash
pnpm install
docker compose up -d   # PostgreSQL on host port 5439
```

### Run Locally

```bash
# Start both apps via Turborepo
pnpm dev

# Or one at a time
pnpm dev:web
pnpm dev:backend
```

Backend listens on `PORT` (default `3000`); Swagger UI at `http://localhost:3000/api`. Set `app-web/.env.local`'s `NEXT_PUBLIC_API_URL` to match.

### Run Tests

```bash
pnpm test            # turbo run test (currently the backend Jest suite)
pnpm test:backend    # alias for the backend tests only
pnpm --filter vendlyhub-backend test:e2e
```

## For AI-Assisted Development

This documentation was generated to enable AI agents to understand and extend this codebase.

### When Planning New Features

- **UI-only features:** reference [`architecture-web.md`](./architecture-web.md) and [`component-inventory-web.md`](./component-inventory-web.md). Always update [`app/config/navigation.ts`](../app-web/src/app/config/navigation.ts) when adding routes.
- **API/Backend features:** reference [`architecture-backend.md`](./architecture-backend.md), [`api-contracts-backend.md`](./api-contracts-backend.md), and [`data-models-backend.md`](./data-models-backend.md). Follow the modular monolith conventions.
- **Full-stack features:** reference both architecture docs plus [`integration-architecture.md`](./integration-architecture.md) for the cross-app contract.
- **Deployment changes:** reference [`deployment-guide.md`](./deployment-guide.md). The repo currently only commits local infra (PostgreSQL via `docker-compose.yml`).

---

_Documentation generated by BMAD Method `document-project` workflow_
