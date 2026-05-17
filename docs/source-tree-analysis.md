# Vendlyhub - Source Tree Analysis

**Date:** 2026-05-16

## Overview

Vendlyhub is a pnpm + Turborepo monorepo housing two TypeScript apps that share no source code: a Next.js 15 web client (`app-web`) and a NestJS 11 REST API backed by PostgreSQL via Prisma (`app-backend`). All cross-app coordination is over HTTP/JSON; there are no shared `packages/` directories.

## Multi-Part Structure

This project is organized into 2 distinct parts:

- **Vendlyhub Web** (`app-web/`): Customer storefront (`/catalog/[slug]`) and authenticated admin UI built on Next.js App Router.
- **Vendlyhub Backend** (`app-backend/`): NestJS REST API with Prisma 7 + PostgreSQL, file uploads served from `/uploads`, Swagger/OpenAPI at `/api`.

## Complete Directory Structure

```
vendlyhub/
├── app-backend/                     # NestJS 11 REST API
│   ├── docs/                        # Existing reference docs (API consumer + per-module)
│   │   ├── API_CONSUMER_GUIDE.md
│   │   └── modules/
│   │       ├── README.md
│   │       ├── addresses.md
│   │       ├── contacts.md
│   │       ├── establishments.md
│   │       ├── products.md
│   │       ├── sessions.md
│   │       └── users.md
│   ├── prisma/
│   │   ├── migrations/              # 8 migrations from init through 2026-05 mobile_number_slug & pix_copy_paste
│   │   ├── reset-initial-state.sql  # Manual reset helper
│   │   └── schema.prisma            # Single source of truth for the data model
│   ├── prisma.config.ts             # Prisma 7 config file
│   ├── nest-cli.json                # Nest CLI options
│   ├── eslint.config.mjs
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── package.json                 # Scripts: build, start:dev, prisma:generate/migrate, test/e2e/cov
│   ├── README.md
│   ├── src/
│   │   ├── main.ts                  # Bootstrap: Express adapter, /uploads static, ValidationPipe, Swagger /api, CORS
│   │   ├── app.module.ts            # Aggregates feature modules
│   │   ├── upload-paths.ts          # Disk paths for logos/avatars/products
│   │   ├── __mocks__/
│   │   │   └── uuid.ts              # Stable UUIDs for Jest
│   │   ├── docs/                    # In-source docs (kept alongside code)
│   │   ├── modules/                 # Feature modules
│   │   │   ├── addresses/           # Address entity + repository + service
│   │   │   ├── catalog/             # Public catalog controller/service
│   │   │   ├── categories/          # Authenticated categories CRUD
│   │   │   ├── contacts/            # Contact entity + repository + service
│   │   │   ├── establishments/      # Establishment entity + repository + service
│   │   │   ├── orders/              # Public POST /catalog/:slug/orders + admin /orders
│   │   │   ├── products/            # Authenticated products CRUD with image upload
│   │   │   ├── sessions/            # Auth: controllers, strategies, guards, use-cases, dto
│   │   │   └── users/               # User domain + use-cases
│   │   ├── shared/
│   │   │   ├── constants/
│   │   │   ├── prisma/              # PrismaService, ClsService, TransactionService
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── types/
│   ├── test/                        # Jest e2e config
│   ├── uploads/                     # Runtime upload dir (logos/avatars/products); served at /uploads
│   ├── coverage/                    # jest --coverage output
│   └── dist/                        # Build output (nest build)
├── app-web/                         # Next.js 15 + React 19
│   ├── public/                      # Static assets served at /
│   ├── eslint.config.mjs
│   ├── next.config.ts
│   ├── next-env.d.ts
│   ├── tsconfig.json
│   ├── package.json                 # Scripts: dev (Turbopack), build, start, lint
│   ├── README.md
│   └── src/
│       ├── middleware.ts            # Cookie-based auth gating + public route prefix list
│       └── app/                     # App Router
│           ├── layout.tsx           # Root layout: ThemeProvider, AuthProvider, Topbar+Sidebar (private only), Toaster
│           ├── page.tsx             # Re-exports /overview as the home page
│           ├── not-found.tsx        # /_not-found rewrite target
│           ├── auth/
│           │   └── callback/page.tsx       # Receives ?access_token & refresh_token from backend OAuth
│           ├── catalog/
│           │   ├── preview/                # Authenticated preview of own catalog
│           │   └── [slug]/                 # Public storefront (matches PUBLIC_ROUTE_PREFIXES)
│           ├── categories/
│           │   ├── page.tsx
│           │   └── schema.ts               # zod validation
│           ├── components/
│           │   ├── Accordion/
│           │   ├── AddAssetForm/
│           │   ├── AssetAllocationForm/
│           │   ├── AssetQuestions/
│           │   ├── Card/
│           │   ├── Charts/
│           │   ├── FastActions/
│           │   ├── FinanceTable/
│           │   ├── Logo/
│           │   ├── Modal/
│           │   ├── orders/
│           │   ├── OnboardingMascotVideo.tsx
│           │   ├── Select/
│           │   ├── Sidebar/
│           │   └── Topbar/
│           ├── config/
│           │   ├── assetTypes.ts           # Asset taxonomy (legacy/finance widgets)
│           │   └── navigation.ts           # PUBLIC/PRIVATE route enums + main nav with lucide icons
│           ├── contexts/
│           │   └── AuthContext.tsx         # login/logout/register/Google OAuth + token storage
│           ├── esqueci-senha/              # Forgot-password page + zod schema
│           ├── establishment/              # Establishment edit page + zod schema
│           ├── fast-onboarding/            # Single-step onboarding (registerMinimal)
│           ├── hooks/                      # useCart, useCatalog, useCatalogFilters, useToggleTheme
│           ├── lib/                        # confetti, mobileSlug, pendingProductDraft, postOnboarding
│           ├── login/                      # Login page + zod schema
│           ├── onboarding-flow/            # Multi-step onboarding flow
│           ├── orders/                     # Authenticated orders page
│           ├── overview/                   # Dashboard / homepage
│           ├── products/                   # Authenticated products page
│           ├── profile/                    # Account profile page
│           ├── redefinir-senha/            # Reset-password page
│           ├── register/                   # Full registration with optional dev fakers
│           ├── services/                   # API client + per-domain services
│           │   ├── apiClient.ts            # Axios instance + Bearer + 401-driven logout
│           │   ├── authService.ts
│           │   ├── authSession.ts
│           │   ├── catalogService.ts
│           │   ├── categoryService.ts
│           │   ├── feedback.ts
│           │   ├── mediaUrl.ts
│           │   ├── mockCatalogService.ts
│           │   ├── mockProductService.ts
│           │   ├── orderService.ts
│           │   ├── productService.ts
│           │   ├── profileService.ts
│           │   ├── whatsappService.ts
│           │   ├── assetService.ts
│           │   ├── assetAllocationService.ts
│           │   └── assetQuestionsService.ts
│           ├── styles/                     # globals.scss, grid-layout, design tokens
│           ├── types/                      # catalog.ts, order.ts, product.ts (frontend types)
│           └── utils/                      # ad-hoc helpers
├── docker-compose.yml                # PostgreSQL 18.1 (port 5439)
├── package.json                      # Root: dev/build/lint/test via turbo + pnpm filters
├── pnpm-workspace.yaml               # Workspaces: app-web, app-backend
├── pnpm-lock.yaml
├── turbo.json                        # build/lint/test/dev pipeline definitions
├── README.md                         # Monorepo quickstart
├── .nvmrc                            # 24.13.0
├── .husky/                           # Git hooks
└── docs/                             # ← Generated documentation lives here (this folder)
```

## Critical Directories

### `app-backend/src/main.ts`

**Purpose:** Application bootstrap.
**Contains:** `bootstrap()` that creates upload directories, registers a static `/uploads` middleware on the underlying Express server **before** Nest mounts routes, configures CORS (`FRONTEND_URL`), enables a global `ValidationPipe({ whitelist, transform })`, sets up Swagger at `/api` with Bearer auth, and listens on `process.env.PORT ?? 3000`.

### `app-backend/src/app.module.ts`

**Purpose:** Root Nest module wiring all feature modules: `Users`, `Addresses`, `Contacts`, `Establishments`, `Sessions` (auth), `Categories`, `Products`, `Catalog`, `Orders`.

### `app-backend/src/modules/`

**Purpose:** Feature-modular monolith. Each module folder follows a consistent shape (with variations):
- `*.module.ts` — Nest module declaration
- `*.controller.ts` — HTTP routes (`@Controller(...)`, `@UseGuards(JwtAuthGuard)`, etc.)
- `*.service.ts` / `services/` — orchestration / business logic
- `dto/` — request DTOs with `class-validator` decorators
- `entities/` — domain entity types
- `repositories/` — interface tokens + Prisma adapters (e.g. `repositories/auth-token.repository.ts` + `repositories/prisma/prisma.auth-token.repository.ts`)
- `use-cases/` (sessions, users) — single-responsibility orchestrations like `RegisterUserUseCase`, `LoginUserUseCase`
- `strategies/`, `guards/` (sessions only) — Passport strategies and Nest guards
- `*.spec.ts` / `*.integration.spec.ts` — Jest unit and integration tests

**Integration:** Every authenticated controller uses `JwtAuthGuard` from `sessions/guards/jwt-auth.guard.ts`; modules typically import `SessionsModule` (or its providers) via Nest DI.

### `app-backend/src/shared/prisma/`

**Purpose:** Database access layer used by every feature module.
**Contains:** `PrismaService`, `ClsService` (request-scoped state), `TransactionService` (used by `RegisterUserUseCase` for atomic user + establishment + address + contacts creation).

### `app-backend/prisma/`

**Purpose:** Prisma schema, migrations, and a SQL helper to reset the database.
**Contains:** `schema.prisma` defines 12 models / 8 enums (User, AuthProvider, AuthToken, PasswordResetToken, Establishment, EstablishmentType, EstablishmentEstablishmentType, Address, Contact, UserEstablishment, Category, Product, Order, OrderItem). Migrations from init (2026-03-23) up to 2026-05-11 (`pix_copy_paste` and `mobile_number_slug`).

### `app-backend/uploads/`

**Purpose:** Runtime file uploads.
**Contains:** Three subfolders created on bootstrap (`logos/`, `avatars/`, `products/`); content is served at `/uploads/...` by Express static middleware registered before Nest.

### `app-web/src/middleware.ts`

**Purpose:** Auth gating at the Next.js edge.
**Contains:** Reads the `auth-token` cookie, runs `isPublicPath` / `isPrivatePath` from `app/config/navigation.ts`, redirects unauthenticated users to `/login?redirect=...` and bounces logged-in users away from `/login`, `/register`, etc. Skips static file extensions and assets under `/_next/...`.

### `app-web/src/app/`

**Purpose:** App Router root. Public-only pages render bare children; private pages render Topbar + Sidebar via `RootLayout`.
**Contains:** Auth/onboarding pages (`login`, `register`, `esqueci-senha`, `redefinir-senha`, `onboarding-flow`, `fast-onboarding`, `auth/callback`), authenticated admin pages (`/`, `overview`, `categories`, `products`, `orders`, `establishment`, `profile`), and the public storefront (`catalog/[slug]` + `catalog/preview`).

### `app-web/src/app/services/`

**Purpose:** API access layer.
**Contains:** `apiClient.ts` (axios instance with request interceptor injecting Bearer token from `localStorage` and response interceptor calling `forceClientLogout` on 401 / "user not found" 404), plus per-domain service modules (`authService`, `categoryService`, `productService`, `orderService`, `catalogService`, `profileService`, `whatsappService`, `feedback`, `mediaUrl`, plus mocks for offline preview).

### `app-web/src/app/components/`

**Purpose:** Reusable UI building blocks.
**Contains:** Layout (`Sidebar`, `Topbar`), data display (`Card`, `Charts`, `FinanceTable`), interaction (`Modal`, `Select`, `Accordion`, `FastActions`), domain widgets (`AddAssetForm`, `AssetAllocationForm`, `AssetQuestions`, `orders/...`), branding (`Logo`, `OnboardingMascotVideo.tsx`).

### `app-web/src/app/contexts/AuthContext.tsx`

**Purpose:** Single React context that owns the authenticated session.
**Contains:** Login (`identifier` = WhatsApp or email), Google OAuth bootstrap (`window.location.href = ${API}/auth/google`), `handleOAuthCallback` consumed by `auth/callback/page.tsx`, full `register`, `registerMinimal` (fast onboarding), `logout`, and a self-healing `checkAuth` that refreshes tokens on mount.

### `app-web/src/app/config/navigation.ts`

**Purpose:** Single source of truth for routing and side-nav.
**Contains:** `ERoutePath` enum, `ROUTES` map (PUBLIC vs PRIVATE), `PUBLIC_ROUTE_PREFIXES` (`/catalog/`), helpers `isPublicPath` / `isPrivatePath`, and the `mainNavigation` items (Resumo, Categorias, Produtos, Pedidos, Estabelecimento) with lucide icons consumed by `Sidebar`.

## Part-Specific Trees

### Vendlyhub Web Structure (high-signal subset)

```
app-web/src/
├── middleware.ts                # Edge auth gate
└── app/
    ├── layout.tsx               # Conditional Topbar+Sidebar based on isPrivatePath
    ├── page.tsx                 # Re-exports OverviewPage
    ├── (auth pages)             # login, register, esqueci-senha, redefinir-senha, fast-onboarding, onboarding-flow
    ├── (private pages)          # overview, categories, products, orders, establishment, profile
    ├── catalog/{preview, [slug]}# Storefront
    ├── auth/callback            # OAuth landing
    ├── components/              # Sidebar, Topbar, Card, Charts, Modal, FastActions, …
    ├── config/                  # navigation.ts, assetTypes.ts
    ├── contexts/AuthContext.tsx
    ├── hooks/                   # useCart, useCatalog, useCatalogFilters, useToggleTheme
    ├── lib/                     # confetti, mobileSlug, pendingProductDraft, postOnboarding
    ├── services/                # apiClient + 15 services
    ├── styles/                  # globals.scss, grid-layout.module.scss, design tokens
    └── types/                   # catalog.ts, order.ts, product.ts
```

**Key Directories:**

- **`src/app/services/`** — every page/component goes through `apiClient` (Axios) for HTTP; never `fetch` directly.
- **`src/app/components/`** — flat folder; each component owns its `.module.scss` (when applicable).
- **`src/app/config/navigation.ts`** — adding a new route requires updating either `ROUTES.PUBLIC`, `ROUTES.PRIVATE`, or `PUBLIC_ROUTE_PREFIXES`; this drives both `middleware.ts` and `RootLayout` rendering.
- **`src/app/(feature)/schema.ts`** — co-located zod schemas pair with `react-hook-form` resolvers.

### Vendlyhub Backend Structure (high-signal subset)

```
app-backend/
├── prisma/
│   ├── schema.prisma            # 12 models, 8 enums
│   └── migrations/              # 8 migrations
├── src/
│   ├── main.ts                  # bootstrap()
│   ├── app.module.ts
│   ├── upload-paths.ts
│   ├── modules/
│   │   ├── sessions/            # auth (deepest module — controllers/, dto/, entities/, guards/, repositories/{,prisma}, services/, strategies/, use-cases/, utils/)
│   │   ├── users/               # users.module + repositories/ + services/ + use-cases/
│   │   ├── establishments/      # entities/, repositories/, services/
│   │   ├── addresses/           # entities/, repositories/, services/
│   │   ├── contacts/            # entities/, repositories/, services/
│   │   ├── categories/          # categories.controller + service + dto/
│   │   ├── products/            # products.controller (multipart) + service + dto/
│   │   ├── catalog/             # public catalog.controller + service
│   │   └── orders/              # public orders.controller + admin orders-admin.controller + service + dto/
│   └── shared/
│       ├── prisma/              # PrismaService, ClsService, TransactionService
│       ├── constants/
│       ├── types/
│       └── utils/
└── test/                        # jest-e2e.json
```

**Key Directories:**

- **`src/modules/sessions/`** — deepest module; every other authenticated module imports `JwtAuthGuard` from here.
- **`src/shared/prisma/`** — only place that imports `@prisma/client` directly.
- **`prisma/migrations/`** — append-only; do not edit existing migration folders.
- **`src/upload-paths.ts`** — central source for `/uploads/*` directories; referenced by `main.ts` and the multer interceptors in `products.controller.ts` and the auth controller's logo/avatar handlers.

## Integration Points

### app-web → app-backend (REST)

- **Location:** `app-web/src/app/services/apiClient.ts` (and the per-domain services that call it)
- **Type:** REST over HTTP/JSON, Bearer token authentication
- **Details:** `baseURL` from `NEXT_PUBLIC_API_URL`. Request interceptor injects `Authorization: Bearer ${localStorage.accessToken}`. Response interceptor calls `forceClientLogout({ reason: 'api-unauthorized', redirectPath: resolveCurrentPath() })` on 401, or on a 404 whose response message contains `"user not found"`. `AuthContext` mirrors the access token to a `auth-token` cookie so Next.js `middleware.ts` can gate routes server-side. Refresh tokens are kept in `localStorage` and used by `authService.refreshToken(...)` from `checkAuth`.

### app-backend → PostgreSQL

- **Location:** `app-backend/src/shared/prisma/prisma.service.ts` and `prisma/schema.prisma`
- **Type:** TCP / Prisma 7 (`@prisma/client` + `@prisma/adapter-pg`)
- **Details:** `DATABASE_URL` is server-only. `TransactionService` orchestrates multi-step writes (e.g. `RegisterUserUseCase`).

### app-backend → SMTP

- **Location:** `app-backend/src/modules/sessions/services/mail.service.ts` (`nodemailer`)
- **Type:** SMTP
- **Details:** Used by the password reset flow (`POST /auth/forgot-password`).

### app-backend → Google OAuth

- **Location:** `app-backend/src/modules/sessions/strategies/google.strategy.ts`
- **Type:** OAuth 2.0 (passport-google-oauth20)
- **Details:** Conditionally registered when `GOOGLE_CLIENT_ID` is set. Success redirects to `${FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...`; failure to `${FRONTEND_URL}/login?error=auth_failed`.

### Shared filesystem (uploads)

- **Location:** `app-backend/uploads/{logos,avatars,products}/`
- **Type:** Local disk, served via Express static middleware at `/uploads/...`.
- **Details:** Filenames are URL paths persisted on the database (`Establishment.logo`, `User.avatar`, `Product.imageUrl`). The web client constructs absolute URLs through `mediaUrl.ts` using `NEXT_PUBLIC_API_URL`.

## Entry Points

### Vendlyhub Web

- **Entry Point:** `app-web/src/app/layout.tsx` (root layout) + `app-web/src/middleware.ts` (edge gate)
- **Bootstrap:** Next.js 15 App Router boots `RootLayout` which wraps every page in `ThemeProvider` → `AuthProvider` → conditional Topbar+Sidebar shell + `Toaster`. `AuthProvider.checkAuth()` runs on first mount and refreshes the access token using the stored refresh token.

### Vendlyhub Backend

- **Entry Point:** `app-backend/src/main.ts`
- **Bootstrap:** `bootstrap()` creates upload dirs, mounts a raw Express `static('/uploads', UPLOADS_ROOT)` before Nest, calls `NestFactory.create(AppModule, ExpressAdapter)`, configures CORS (`FRONTEND_URL`, credentials true), the global `ValidationPipe`, builds Swagger (`Vendlyhub API`) at `/api`, and starts on `PORT` (default 3000).

## File Organization Patterns

- **Backend feature module shape** — one folder per Nest feature with `*.module.ts`, controllers/services/dto/entities/repositories. The `sessions` and `users` modules go further with `use-cases/`, `strategies/`, `guards/`, and repository interface + Prisma adapter pairs. Tests live next to source as `*.spec.ts` and `*.integration.spec.ts`.
- **Frontend route co-location** — every route folder under `app/` keeps its `page.tsx`, `*.module.scss` and (for forms) `schema.ts` co-located. Re-usable widgets escalate to `components/`. Cross-cutting helpers live in `services/`, `hooks/`, `lib/`, `config/`, `contexts/`.
- **Validation separation** — backend uses `class-validator` DTOs (`*.dto.ts`); frontend uses `zod` schemas (`schema.ts`). Both ultimately validate the same wire shape but never share code.
- **Routing source of truth** — `app-web/src/app/config/navigation.ts` is required reading before adding any new page; it powers both middleware (auth) and layout (chrome).

## Key File Types

### TypeScript source

- **Pattern:** `**/*.ts`, `**/*.tsx`
- **Purpose:** All application code is TypeScript. Backend is `commonjs` (`"type": "commonjs"` in `app-backend/package.json`); web uses Next.js' default ESM bundling.
- **Examples:** `app-backend/src/modules/sessions/use-cases/register-user.usecase.ts`, `app-web/src/app/services/apiClient.ts`

### DTOs (backend)

- **Pattern:** `app-backend/src/modules/*/dto/*.dto.ts`
- **Purpose:** Request validation with `class-validator` and shape transformation with `class-transformer` under the global `ValidationPipe`.
- **Examples:** `register.dto.ts`, `login.dto.ts`, `create-product.dto.ts`, `list-products-query.dto.ts`, `update-category.dto.ts`, `create-order.dto.ts`.

### Zod schemas (web)

- **Pattern:** `app-web/src/app/*/schema.ts`
- **Purpose:** Form validation with `react-hook-form` resolvers (`@hookform/resolvers/zod`).
- **Examples:** `login/schema.ts`, `register/schema.ts`, `establishment/schema.ts`, `categories/schema.ts`, `products/schema.ts`, `profile/schema.ts`.

### SCSS modules

- **Pattern:** `**/*.module.scss`
- **Purpose:** Component- and page-scoped styling on the web.
- **Examples:** `app-web/src/app/login/styles.module.scss`, `app-web/src/app/components/Card/...`.

### Prisma artifacts

- **Pattern:** `app-backend/prisma/schema.prisma`, `app-backend/prisma/migrations/**`
- **Purpose:** Database schema and migration history.
- **Examples:** `20260323105156_init`, `20260511024000_add_pix_copy_paste_to_establishment`.

### Tests

- **Pattern:** `app-backend/src/**/*.spec.ts`, `app-backend/src/**/*.integration.spec.ts`, `app-backend/test/jest-e2e.json`
- **Purpose:** Unit, integration, and e2e suites with `jest`/`supertest`.

## Asset Locations

- **Web public assets**: `app-web/public/` — favicons, manifest, marketing media. Served at `/`.
- **Runtime uploads**: `app-backend/uploads/{logos,avatars,products}/` — written by multer interceptors, served at `/uploads/...`.

## Configuration Files

- **`docker-compose.yml`** — local PostgreSQL 18.1; healthcheck via `pg_isready`; volume `vendlyhub_postgres_data`; host port `5439`.
- **`turbo.json`** — pipelines: `build` (depends on upstream `^build`, outputs `dist/**` and `.next/**`), `lint` / `test` (cascading via `^`), `dev` and `start:dev` (cache-disabled, persistent).
- **`pnpm-workspace.yaml`** — declares `app-web` and `app-backend` as the workspace packages.
- **`package.json`** (root) — orchestration scripts (`dev`, `build`, `lint`, `test`, plus `*:web` and `*:backend` filters), pinned to `pnpm@10.27.0`.
- **`app-web/next.config.ts`**, **`app-web/eslint.config.mjs`**, **`app-web/tsconfig.json`** — Next.js, ESLint, and TS configs.
- **`app-backend/nest-cli.json`**, **`app-backend/prisma.config.ts`**, **`app-backend/eslint.config.mjs`**, **`app-backend/tsconfig.{json,build.json}`** — Nest CLI, Prisma 7, ESLint, and TS configs.
- **`.nvmrc`** at root pins Node `24.13.0`. Each app also has its own `.nvmrc`.
- **`.husky/`** — git hooks (e.g. lint on commit).

## Notes for Development

- When adding a new backend feature module, follow the shape of `categories` (simple CRUD) for thin domains and `sessions`/`users` (with `use-cases/`, `repositories/{,prisma}`) for richer ones.
- Any controller method that needs the authenticated user must use `@UseGuards(JwtAuthGuard)` and read `req.user.userId` (the JWT subject is mapped to `userId` by `JwtStrategy`).
- File-upload routes must use a `FileInterceptor` with both `fileFilter` (MIME) and `limits.fileSize` set, plus the corresponding directory from `src/upload-paths.ts`.
- New web pages: register them under `ROUTES.PUBLIC` or `ROUTES.PRIVATE` in `navigation.ts` (or add a prefix to `PUBLIC_ROUTE_PREFIXES`); otherwise `middleware.ts` will rewrite them to `_not-found` for unauthenticated users.
- Forms should pair a `schema.ts` (zod) with `react-hook-form` and submit through the matching service in `app-web/src/app/services/`.
- Never call the backend with `fetch` directly from the web; always go through `apiClient`, so the 401 logout interceptor stays consistent.
- Migrations are append-only; create a new one with `pnpm --filter vendlyhub-backend prisma:migrate:dev --name <change>`.

---

_Generated using BMAD Method `document-project` workflow_
