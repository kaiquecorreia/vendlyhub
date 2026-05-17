# Vendlyhub Web - Development Guide

**Date:** 2026-05-16
**Path:** `app-web/`

How to set up, run, and contribute to the Next.js 15 web client.

## Prerequisites

- **Node.js 24.13.0** (`.nvmrc` at the repository root pins this; `app-web/.nvmrc` matches). The `app-web/package.json` declares `engines.node: ">=22.14.0"`, so any 22+ runtime works locally, but pin to root.
- **pnpm 10.27.0** (declared as `packageManager` in the root `package.json`).
- **A running backend** at the URL configured in `NEXT_PUBLIC_API_URL` — typically the local NestJS app on `http://localhost:3000`.

## Environment Variables

Set in `app-web/.env.local` (already present in the repo):

| Variable | Purpose | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL for `apiClient` (Axios) and the Google login bootstrap (`window.location.href = ${API_URL}/auth/google`) | Public; inlined at build time. |

The repo's `.env.local` already contains a default. Adjust if running the backend on a non-default port.

## Install

From the repository root:

```bash
pnpm install
```

This installs both workspaces; `app-web` reuses the same lockfile (`pnpm-lock.yaml`).

## Run in development

From the repository root (preferred — orchestrated by Turborepo + pnpm):

```bash
pnpm dev:web
```

Or run both apps at once:

```bash
pnpm dev
```

Equivalent direct command from inside `app-web/`:

```bash
pnpm dev   # next dev --turbopack
```

The dev server uses **Turbopack**.

## Build & start

```bash
pnpm build:web    # next build (from repo root)
pnpm --filter vendlyhub-web start  # next start
```

`turbo` declares `.next/**` (excluding `.next/cache/**`) as build output; that is what gets cached/restored by Turborepo.

## Lint

```bash
pnpm lint:web     # next lint
pnpm --filter vendlyhub-web lint-fix   # next lint --fix
```

ESLint configuration is `app-web/eslint.config.mjs`, which extends `eslint-config-next` plus `eslint-config-prettier`.

## Tests

There is currently no automated frontend test suite. Validation relies on TypeScript + ESLint and on the backend's e2e suite. If you add tests, prefer Vitest/Jest + React Testing Library for components and Playwright for the public storefront and the auth/onboarding flow.

## Project Structure (essentials)

```
app-web/src/
├── middleware.ts                    # Edge auth gate (cookie-based)
└── app/
    ├── layout.tsx                   # Conditional Topbar+Sidebar shell + Toaster
    ├── page.tsx                     # → OverviewPage
    ├── auth/callback/page.tsx       # OAuth landing
    ├── catalog/{preview,[slug]}/    # Storefront
    ├── (auth pages)                 # login, register, fast-onboarding, onboarding-flow, esqueci-senha, redefinir-senha
    ├── (private pages)              # overview, categories, products, orders, establishment, profile
    ├── components/                  # Reusable UI components
    ├── config/navigation.ts         # Routing source of truth
    ├── contexts/AuthContext.tsx     # Authenticated session
    ├── hooks/                       # useCart, useCatalog, useCatalogFilters, useToggleTheme
    ├── lib/                         # confetti, slug, drafts, post-onboarding helpers
    ├── services/                    # apiClient + per-domain services
    ├── styles/                      # globals.scss + grid-layout
    └── types/                       # catalog/order/product
```

See [source-tree-analysis.md](./source-tree-analysis.md) and [architecture-web.md](./architecture-web.md) for the full picture.

## Adding a Page

1. Create the route folder under `app-web/src/app/<route>/` with a `page.tsx`.
2. **Update `app-web/src/app/config/navigation.ts`** — add the path to `ROUTES.PUBLIC`, `ROUTES.PRIVATE`, or extend `PUBLIC_ROUTE_PREFIXES`. If you skip this, `middleware.ts` will treat the page as invalid:
   - Unauthenticated users will be redirected to `/login`.
   - Authenticated users will be rewritten to `_not-found`.
3. If the page should appear in the sidebar, add a `NavigationItem` to `mainNavigation`.
4. For form pages: add `schema.ts` (zod), wire `react-hook-form` with `@hookform/resolvers/zod`, and submit through the matching service in `app-web/src/app/services/`.
5. If the page needs styling, add `styles.module.scss` next to `page.tsx`.

## Calling the Backend

Always go through `app-web/src/app/services/apiClient.ts`:

```ts
import { apiClient } from '@/app/services/apiClient';

const { data } = await apiClient.get('/products');
```

The Axios instance:

- Uses `NEXT_PUBLIC_API_URL` as `baseURL`.
- Injects `Authorization: Bearer ${localStorage.accessToken}` on every request (client-side only).
- Calls `forceClientLogout(...)` on 401 responses (and on 404s whose body message includes `"user not found"`), clearing tokens and redirecting to `/login` with a `redirect` parameter so the user can come back.

When you build a new domain service:

1. Create `app-web/src/app/services/<domain>Service.ts`.
2. Use `apiClient` (no raw `axios`/`fetch`).
3. Surface backend errors via `normalizeApiError` for consistent toasts.

## Auth Flow Overview

1. User logs in (`/login`) → `authService.login` → backend issues `{ access_token, refresh_token }`.
2. `AuthContext.storeAuthData` writes both tokens + the user object to `localStorage` and mirrors the access token into a `auth-token` cookie.
3. The cookie is read by `middleware.ts` on every navigation; the `localStorage` value is read by the Axios interceptor on every API call.
4. On reload, `AuthProvider.checkAuth()` calls `authService.refreshToken(refreshToken)` to get a fresh access token, then `profileService.getProfile()`.
5. Logout (or any forced logout from the response interceptor) clears both `localStorage` and the cookie.

## Theming

`next-themes` is configured in `RootLayout` (`attribute="class" enableSystem defaultTheme="system"`). The `useToggleTheme` hook (in `app/hooks/`) toggles between light and dark; SCSS is expected to use the `[data-theme]` attribute or a CSS variable scheme set by `next-themes`.

## Troubleshooting

- **Endless redirect loop on private routes** — verify the route exists in `ROUTES.PRIVATE`; otherwise `middleware.ts` will keep treating it as invalid.
- **Spurious logout** — check the response interceptor in `apiClient.ts`. A backend 404 with the message `"user not found"` is treated as an invalid session.
- **Hydration warning** — `RootLayout` uses `suppressHydrationWarning` on `<html>` because `next-themes` flips the class attribute on the client.
- **CORS errors** — the backend allows only `FRONTEND_URL`. Set it on the backend to match wherever you serve the SPA in dev/prod.
- **404 on `/uploads/...`** — make sure the backend Express static middleware in `main.ts` runs before Nest mounts; if you fork the bootstrap, preserve that ordering.

---

_Generated using BMAD Method `document-project` workflow_
