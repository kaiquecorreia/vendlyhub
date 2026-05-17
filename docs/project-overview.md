# Vendlyhub - Project Overview

**Date:** 2026-05-16
**Type:** Monorepo (multi-part)
**Architecture:** Decoupled SPA (Next.js web client) + REST API (NestJS backend) over PostgreSQL

## Executive Summary

Vendlyhub is a SaaS platform that lets small establishments (restaurants, pizzarias, and similar businesses) onboard, manage their catalog (categories, products with images), receive orders from a public web storefront (`/catalog/[slug]`), and confirm them through an authenticated admin area. The platform supports email/password and Google OAuth authentication, and exposes a public catalog so the establishment's customers can browse products and place orders without an account.

The codebase is a **pnpm + Turborepo monorepo** with two cooperating apps:

- **`app-web`** — Next.js 15 / React 19 customer-facing and admin web app (App Router, SCSS modules).
- **`app-backend`** — NestJS 11 REST API with Prisma 7 over PostgreSQL 18, JWT + refresh tokens, optional Google OAuth, file uploads (logos, avatars, product images) and an OpenAPI/Swagger UI at `/api`.

Local development runs the database in Docker Compose; the apps run via `turbo run dev` from the repo root.

## Project Classification

- **Repository Type:** Monorepo (pnpm workspaces, orchestrated by Turborepo)
- **Project Type(s):** `web` (Next.js) + `backend` (NestJS)
- **Primary Language(s):** TypeScript (both parts)
- **Architecture Pattern:** Modular monolith API (NestJS feature modules with use-cases + repositories) communicating with a Next.js App Router frontend via HTTP/JSON. The frontend additionally exposes a public catalog route (`/catalog/[slug]`) backed by public backend endpoints.

## Multi-Part Structure

This project consists of 2 distinct parts:

### Vendlyhub Web (`app-web`)

- **Type:** web (Next.js)
- **Location:** `app-web/`
- **Purpose:** Customer-facing storefront (`/catalog/[slug]`, `/catalog/preview`) plus authenticated admin UI for products, categories, orders, profile and establishment management. Hosts onboarding and registration flows (`/register`, `/onboarding-flow`, `/fast-onboarding`) and password recovery (`/esqueci-senha`, `/redefinir-senha`).
- **Tech Stack:** Next.js 15.2.8, React 19, TypeScript 5, Axios, react-hook-form + zod, SASS modules, next-themes, lucide-react, recharts, sonner, firebase.

### Vendlyhub Backend (`app-backend`)

- **Type:** backend (NestJS)
- **Location:** `app-backend/`
- **Purpose:** REST API for authentication, user/establishment onboarding, catalog domain (categories, products, public catalog browsing) and orders (public creation, authenticated admin listing/confirmation). Persists data in PostgreSQL via Prisma; serves uploaded files from `/uploads`.
- **Tech Stack:** NestJS 11, Express 5, Prisma 7 (PostgreSQL), Passport (JWT, local, Google OAuth), bcrypt, multer, nodemailer, Swagger/OpenAPI, Jest.

### How Parts Integrate

The web app calls the backend API over HTTP/JSON (Axios `apiClient` configured with `NEXT_PUBLIC_API_URL`). Authentication uses a JWT access token (sent as `Authorization: Bearer ...` and mirrored to a `auth-token` cookie consumed by Next.js `middleware.ts` for route gating) plus an opaque refresh token (UUID, 7-day expiry) stored server-side as a hash in the `auth_token` table. CORS is configured on the backend to accept the frontend origin (`FRONTEND_URL`, default `http://localhost:3001`) with credentials. See [integration-architecture.md](./integration-architecture.md) for the full surface.

## Technology Stack Summary

### Vendlyhub Web Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.2.8 | SSR/edge-friendly React framework with file-based routing; powers both the public storefront and the authenticated admin UI |
| UI Runtime | React | 19.0.0 | Latest React; matches Next.js 15 |
| Language | TypeScript | 5.x | Type safety across services and components |
| HTTP client | axios | 1.9.0 | Centralized `apiClient` with interceptors (Bearer header injection + 401-driven forced logout) |
| Forms | react-hook-form + zod + @hookform/resolvers | 7.57 / 3.25 / 5.0 | Schema-driven validation for register/login/profile/product forms |
| Styling | SASS Modules + next-themes | 1.86 / 0.4 | Per-page `*.module.scss`; theme switching via `next-themes` |
| Icons | lucide-react + react-icons | 0.487 / 5.5 | Lightweight icon system used by Sidebar/Topbar/Cards |
| Charts | recharts | 2.15 | Dashboard/overview charts |
| Notifications | sonner | 2.0 | Toast notifications mounted in `RootLayout` |
| Misc | firebase, canvas-confetti, qrcode.react, react-input-mask, react-number-format, date-fns | various | Onboarding flourish (confetti), QR code rendering for catalog sharing, masked inputs, date utilities |
| Linting | ESLint + Prettier (eslint-config-next) | 9 / 3.5 | Standardized formatting and Next.js rules |
| Architecture Style | App Router + Middleware-based auth gating | – | `src/app/middleware.ts` redirects based on `auth-token` cookie |

### Vendlyhub Backend Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | NestJS | 11.0.x | Modular DI-driven backend with first-class testing and Swagger |
| HTTP server | Express | 5.2.1 (via `@nestjs/platform-express`) | Adapter chosen so static `/uploads` middleware can be registered before Nest mounts routes |
| Language | TypeScript | 5.7 | Strict typing across modules, DTOs, and use-cases |
| ORM | Prisma | 7.3 (`@prisma/client`, `@prisma/adapter-pg`) | Type-safe data access; migrations under `prisma/migrations/` |
| Database | PostgreSQL | 18.1 (Docker image `postgres:18.1`) | Primary persistence; only Prisma talks to it |
| Auth | @nestjs/jwt, @nestjs/passport, passport-jwt, passport-local, passport-google-oauth20, bcrypt | 11.x / 4.x / 1.x / 2.x / 6.x | JWT access tokens (1h), refresh tokens (UUID, 7d hashed), local password strategy, optional Google OAuth |
| Validation | class-validator + class-transformer (global `ValidationPipe` with `whitelist + transform`) | 0.14 / 0.5 | DTO-level validation, request whitelisting, type transformation |
| OpenAPI | @nestjs/swagger | 11.2 | Swagger UI at `/api`, Bearer auth declared in `main.ts` |
| Uploads | multer | 2.1 | `FileInterceptor` with disk storage for logos, avatars and product images; size/MIME constraints enforced |
| Email | nodemailer | 8.0 | Password reset emails (sessions module) |
| Tests | jest, ts-jest, supertest | 29 / 29 / 7 | Unit + integration + e2e (`test:e2e` config under `test/`) |
| Architecture Style | Modular monolith: feature modules → controllers → use-cases / services → repositories (Prisma) | – | Sessions module showcases `use-cases/`, `repositories/` (interface + Prisma adapter), `strategies/`, `guards/`, `dto/` |

## Key Features

- **Authentication & Authorization:** Email/password (bcrypt-hashed) and optional Google OAuth, JWT access tokens (1h) + opaque refresh tokens (UUID, 7d, server-stored hashed), `JwtAuthGuard` protecting admin routes.
- **Onboarding:** Standard flow (`/register` + `/onboarding-flow`) and a fast onboarding flow (`/fast-onboarding` + `POST /auth/register-minimal`) that creates user + establishment + address + contacts in a single Prisma transaction. `OnboardingStatus` (`draft | minimal_completed | completed`) tracks progress; `POST /auth/onboarding/complete` finalizes it.
- **Establishment management:** Edit profile (name, document, types), upload/change logo, set Pix copy-paste; supports many-to-many `establishment_type` join (`Restaurantes`, `Pizzarias`, …).
- **Catalog domain:**
  - **Categories:** scoped per establishment; auto-creates a default `"Geral"` category when needed.
  - **Products:** name, SKU (auto-generated when omitted), brand, model, description, sale price, discount, cost, margin, unit, stock metrics, supplier, EAN, image upload (multipart with JPEG/PNG/WebP, max 5 MB) and soft-delete via `deletedAt`.
  - **Public storefront:** `GET /catalog/:slug`, `GET /catalog/:slug/highlighted` and `POST /catalog/:slug/orders` enable an unauthenticated buyer to browse a catalog and submit an order using the establishment slug.
- **Orders:**
  - Public order creation (`POST /catalog/:slug/orders`) with customer name, WhatsApp, address and order items.
  - Authenticated admin listing and confirmation (`GET /orders`, `PATCH /orders/:id/confirm`).
- **File uploads:** logos (`/uploads/logos/`), avatars (`/uploads/avatars/`), product images (`/uploads/products/`); each handler enforces MIME and size limits; the static middleware is registered before Nest routes so 404s do not shadow file requests.
- **API surface visibility:** Swagger UI at `/api` with bearer auth, plus a long-form `API_CONSUMER_GUIDE.md` describing every public endpoint.
- **Frontend route guards:** `app-web/src/app/middleware.ts` redirects based on JWT cookie and the public/private route lists in `app/config/navigation.ts`. Authenticated users hitting `/login` or `/fast-onboarding` are redirected (e.g. to `/catalog/preview`).

## Architecture Highlights

- **Modular monolith on the backend:** each feature (`users`, `sessions`, `addresses`, `contacts`, `establishments`, `categories`, `products`, `catalog`, `orders`) is a self-contained Nest module with its own controller(s), service(s), DTOs, entities and (where applicable) use-cases and repository interfaces with Prisma adapters. Domain code talks to repositories, not directly to Prisma, in modules that adopted the pattern (notably `sessions`, `users`, `establishments`, `addresses`, `contacts`).
- **Single shared Prisma layer:** `app-backend/src/shared/prisma/` exposes `PrismaService`, `ClsService` and `TransactionService`. `register-user.usecase.ts` uses `TransactionService` to create user + establishment + address + contacts atomically.
- **Two HTTP surfaces:** authenticated admin (`/auth/*`, `/products`, `/categories`, `/orders`) and public storefront (`/catalog/:slug`, `/catalog/:slug/highlighted`, `/catalog/:slug/orders`).
- **Frontend split into public and private routes:** middleware enforces auth; private routes render Topbar + Sidebar via `RootLayout`, public routes render bare children.
- **Cookie + localStorage hybrid auth on the web:** access token lives in `localStorage` for the Axios interceptor; the same token is mirrored to a `auth-token` cookie so Next.js middleware can gate routes on the server.
- **Schema-first validation:** zod schemas live next to each form/page in `app-web` (`schema.ts`); DTOs with `class-validator` decorators do the same job on the backend.

## Development Overview

### Prerequisites

- Node.js **24.13.0** (`.nvmrc` at the repository root pins this)
- pnpm **10.27.0**
- Docker (for the local PostgreSQL container)

### Getting Started

```bash
# install all workspaces
pnpm install

# start local PostgreSQL (port 5439 → container 5432)
docker compose up -d

# run both apps (Turbopack dev for web, nest start --watch for backend)
pnpm dev
```

Backend listens on `PORT` (default 3000). Web listens on Next.js default (3000) — when both run locally you typically point `app-web` to a different port via your shell or run them one at a time using `pnpm dev:web` and `pnpm dev:backend`. The backend default `FRONTEND_URL` is `http://localhost:3001` (CORS).

### Key Commands

#### Vendlyhub Web (`app-web`)

- **Install:** `pnpm install` (run from repo root)
- **Dev:** `pnpm dev:web` (delegates to `next dev --turbopack`)
- **Build:** `pnpm build:web` (delegates to `next build`)
- **Lint:** `pnpm lint:web`

#### Vendlyhub Backend (`app-backend`)

- **Install:** `pnpm install` (run from repo root)
- **Dev:** `pnpm dev:backend` (delegates to `nest start --watch`)
- **Build:** `pnpm build:backend` (runs `prisma generate` then `nest build`)
- **Lint:** `pnpm lint:backend` (runs `prisma generate` then `eslint --fix`)
- **Test:** `pnpm test:backend` (runs `prisma generate` then `jest`); also `test:e2e` and `test:cov` from inside `app-backend/`
- **Prisma:** `pnpm --filter vendlyhub-backend prisma:migrate:dev` / `prisma:studio`

## Repository Structure

```
vendlyhub/
├── app-web/                Next.js 15 + React 19 (web client + admin UI)
├── app-backend/            NestJS 11 + Prisma 7 (REST API)
│   ├── prisma/             schema.prisma + migrations + reset SQL
│   ├── docs/               existing API + module docs
│   └── uploads/            served at /uploads (logos, avatars, products)
├── docker-compose.yml      local PostgreSQL 18.1 (port 5439)
├── pnpm-workspace.yaml     workspace declaration
├── turbo.json              build/lint/test/dev pipelines
└── package.json            root scripts orchestrating both apps via turbo + pnpm filters
```

## Documentation Map

For detailed information, see:

- [index.md](./index.md) — Master documentation index
- [architecture-web.md](./architecture-web.md) — Web architecture detail
- [architecture-backend.md](./architecture-backend.md) — Backend architecture detail
- [integration-architecture.md](./integration-architecture.md) — How `app-web` talks to `app-backend`
- [api-contracts-backend.md](./api-contracts-backend.md) — Endpoint catalog
- [data-models-backend.md](./data-models-backend.md) — Prisma schema and database structure
- [component-inventory-web.md](./component-inventory-web.md) — Web component catalog
- [development-guide-web.md](./development-guide-web.md) / [development-guide-backend.md](./development-guide-backend.md) — Setup and dev workflow
- [deployment-guide.md](./deployment-guide.md) — Local infra and deployment notes
- [source-tree-analysis.md](./source-tree-analysis.md) — Annotated directory structure

---

_Generated using BMAD Method `document-project` workflow_
