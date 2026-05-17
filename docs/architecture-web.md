# Vendlyhub Web - Architecture

**Date:** 2026-05-16
**Part:** `app-web`
**Project Type:** web (Next.js 15 / React 19)

## Executive Summary

`app-web` is the customer-facing and admin web client of Vendlyhub, built on Next.js 15 (App Router) with React 19 and TypeScript 5. It serves two audiences from one codebase:

- **Authenticated establishment owners** — onboarding, dashboard, products, categories, orders, profile, and establishment settings.
- **Anonymous buyers** — public storefront under `/catalog/[slug]` to browse a particular establishment's catalog and place orders.

Authentication state is handled by an `AuthContext` that persists tokens to `localStorage` (used by an Axios `apiClient` interceptor) and mirrors the access JWT to a `auth-token` cookie consumed by `middleware.ts` for edge-side route gating. All HTTP traffic to the API goes through the central `apiClient`.

## Technology Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.2.8 (Turbopack dev) | File-based routing for both public and private surfaces; App Router middleware handles auth |
| UI Runtime | React | 19.0.0 | Pairs with Next.js 15 |
| Language | TypeScript | 5.x | Type safety for services, schemas, hooks, and components |
| HTTP client | axios | 1.9.0 | Centralized `apiClient` with Bearer header injection and 401 -> logout handling |
| Forms / Validation | react-hook-form 7.57 + zod 3.25 + @hookform/resolvers 5.0 | – | Schema-first validation co-located with each form (`schema.ts`) |
| State | React Context (`AuthContext`) | – | Single authenticated session source; no global store library |
| Styling | SASS Modules + `next-themes` | 1.86 / 0.4 | Per-page `*.module.scss`; light/dark theming |
| Icons | lucide-react 0.487 + react-icons 5.5 | – | Sidebar/Topbar/Card icons |
| Charts | recharts | 2.15 | Overview/dashboard widgets |
| Notifications | sonner | 2.0 | Toaster mounted in `RootLayout` |
| Misc | firebase 11.9, canvas-confetti 1.9, qrcode.react 4.2, react-input-mask, react-number-format, date-fns 4.1 | – | Optional Firebase integration, onboarding confetti, QR code for shareable catalog links, masked inputs, date utilities |
| Linting | ESLint 9 + Prettier 3.5 + eslint-config-next | – | Standardized formatting and Next.js rules |

**Runtime:** Node.js (root pin `24.13.0`; the app-level `engines.node` is `>=22.14.0`). pnpm `10.27.0`.

## Architecture Pattern

- **App Router with conditional shell** — `src/app/layout.tsx` is the single root layout. It computes `isPrivatePath(pathname)` from `app/config/navigation.ts`. Private routes get the full chrome (Topbar + Sidebar + content slot); public routes (login, register, catalog, OAuth callback, password reset) render the `children` directly.
- **Edge auth gating** — `src/middleware.ts` reads the `auth-token` cookie, classifies the path with `isPublicPath` / `isPrivatePath` (and `PUBLIC_ROUTE_PREFIXES = ['/catalog/']`), and redirects accordingly:
  - Unauthenticated → private route: redirect to `/login?redirect=<original-path>`.
  - Unknown path: redirect to `/login` if unauthenticated, or rewrite to `/_not-found` if authenticated.
  - Authenticated user hitting `/login`, `/register`, `/onboarding-flow`, `/fast-onboarding`, `/esqueci-senha`, `/redefinir-senha`: redirect away (default `/`, special case `/fast-onboarding -> /catalog/preview`).
  - Static file extensions (images, fonts, video, audio, JSON, etc.) and `/api`, `/_next/static`, `/_next/image`, `favicon.ico`, `logo.png`, `perfil.jpeg` skip middleware.
- **Centralized API access** — `src/app/services/apiClient.ts` is an Axios instance configured with `baseURL = process.env.NEXT_PUBLIC_API_URL`, a request interceptor that injects the access token from `localStorage`, and a response interceptor that calls `forceClientLogout({ reason: 'api-unauthorized', redirectPath: resolveCurrentPath() })` on 401 (or on a 404 message containing `"user not found"`).
- **Domain-specific service modules** — Each backend area has a paired client service: `authService`, `categoryService`, `productService`, `orderService`, `catalogService`, `profileService`, `whatsappService`. Pages call these services; they never call `axios` or `fetch` directly.
- **Form pages** — Each form page is co-located with its `schema.ts` (zod) and `styles.module.scss`. `react-hook-form` + zod resolver drives validation.
- **Auth lifecycle** — `AuthContext.checkAuth()` runs on first mount: if both tokens exist in `localStorage`, it calls `authService.refreshToken(refreshToken)`, replaces the access token, fetches `/auth/me` via `profileService.getProfile`, and re-stores the data. A `AUTH_INVALID_SESSION_EVENT` window event clears the user state when the API client forces a logout.

## Module Inventory

### Routes (`src/app/`)

#### Public routes (no auth)
| Path | Folder | Purpose |
|---|---|---|
| `/login` | `login/` | Email/WhatsApp + password sign-in (with optional Google OAuth button via `googleLogin()`); zod-validated form |
| `/register` | `register/` | Full registration (user + establishment + address + contacts + optional logo upload). Includes `devFakeCatalog.ts` and `devFakeCompany.ts` for local development. |
| `/fast-onboarding` | `fast-onboarding/` | Single-step onboarding (calls `registerMinimal`); after success, middleware re-routes to `/catalog/preview` |
| `/onboarding-flow` | `onboarding-flow/` | Multi-step onboarding flow |
| `/esqueci-senha` | `esqueci-senha/` | Forgot-password (`POST /auth/forgot-password`) |
| `/redefinir-senha` | `redefinir-senha/` | Reset-password (`POST /auth/reset-password`) |
| `/auth/callback` | `auth/callback/page.tsx` | Receives `?access_token` & `?refresh_token` from backend Google OAuth; calls `handleOAuthCallback` |
| `/catalog/[slug]` | `catalog/[slug]/` | Public storefront — uses `catalogService` (`GET /catalog/:slug`) |
| `/catalog/preview` | `catalog/preview/` | Same UI but for the authenticated owner previewing their own catalog |

#### Private routes (require JWT cookie)
| Path | Folder | Purpose |
|---|---|---|
| `/` | `page.tsx` → `OverviewPage` | Re-exports `/overview` |
| `/overview` | `overview/` | Dashboard with charts (`recharts`) |
| `/categories` | `categories/` | Establishment categories CRUD UI |
| `/products` | `products/` | Product CRUD UI (forms + image upload) |
| `/orders` | `orders/` | Order list and confirmation actions |
| `/establishment` | `establishment/` | Establishment profile, types, document, Pix |
| `/profile` | `profile/` | User profile (avatar, password) |

### Configuration & shell

- **`src/app/layout.tsx`** — root shell. Wraps with `<ThemeProvider>` (next-themes), `<AuthProvider>`, conditional `<Topbar/> + <Sidebar/>`, and a `<Toaster>` (sonner). Loads Google Font `Quicksand`.
- **`src/middleware.ts`** — auth/route gating (see Architecture Pattern).
- **`src/app/config/navigation.ts`** — single source of truth for routing: `ERoutePath` enum, `ROUTES` map, `PUBLIC_ROUTE_PREFIXES`, `mainNavigation` items consumed by `Sidebar`.
- **`src/app/contexts/AuthContext.tsx`** — `AuthProvider` exposing `login`, `logout`, `googleLogin`, `handleOAuthCallback`, `register`, `registerMinimal`, `refreshUser`, plus `user` and `loading` state.

### Services (`src/app/services/`)

| Service | Responsibilities |
|---|---|
| `apiClient.ts` | Axios instance + interceptors + `normalizeApiError` helper |
| `authService.ts` | login, register, registerMinimal, logout, refresh, forgot-password, reset-password, Google login URL |
| `authSession.ts` | `clearAuthSessionStorage`, `forceClientLogout`, `resolveCurrentPath`, `AUTH_INVALID_SESSION_EVENT` |
| `profileService.ts` | `GET /auth/me`, `PATCH /auth/me` (avatar/whatsapp/name) |
| `categoryService.ts` | Categories CRUD |
| `productService.ts` | Products CRUD (multipart for create/update) |
| `orderService.ts` | Admin order list + confirm |
| `catalogService.ts` | Public catalog browsing for authenticated preview and storefront |
| `whatsappService.ts` | Helpers for WhatsApp ordering URLs |
| `feedback.ts` | Toast / error feedback helpers |
| `mediaUrl.ts` | Build absolute URLs for `/uploads/...` from `NEXT_PUBLIC_API_URL` |
| `mockCatalogService.ts` / `mockProductService.ts` | Offline mocks for design/dev |
| `assetService.ts`, `assetAllocationService.ts`, `assetQuestionsService.ts` | Legacy/finance widgets used by `AddAssetForm` etc. |

### Components (`src/app/components/`)

Layout: `Sidebar`, `Topbar`, `Logo`, `OnboardingMascotVideo.tsx`.
Data display: `Card`, `Charts`, `FinanceTable`, `orders/...`.
Inputs / interaction: `Modal`, `Select`, `Accordion`, `FastActions`, `AddAssetForm`, `AssetAllocationForm`, `AssetQuestions`.

See [component-inventory-web.md](./component-inventory-web.md) for the catalog with categories.

### Hooks (`src/app/hooks/`)

- **`useCart.ts`** — cart state for the public catalog/storefront flow.
- **`useCatalog.ts`** + **`useCatalogFilters.ts`** — fetch and filter catalog data.
- **`useToggleTheme.ts`** — light/dark toggle (uses `next-themes`).

### Lib (`src/app/lib/`)

- **`confetti.ts`** — wraps `canvas-confetti` for onboarding success.
- **`mobileSlug.ts`** — derive a slug from a phone/whatsapp.
- **`pendingProductDraft.ts`** — persists in-progress product drafts (likely `localStorage`/`sessionStorage`) for onboarding continuity.
- **`postOnboarding.ts`** — coordinated post-onboarding actions.

### Styles & types

- **`src/app/styles/`** — `globals.scss`, design tokens, `grid-layout.module.scss` used by the conditional admin shell.
- **`src/app/types/`** — domain types (`catalog.ts`, `order.ts`, `product.ts`).

## Component Overview

See [component-inventory-web.md](./component-inventory-web.md). Highlights:

- **`Sidebar`** — driven by `mainNavigation` from `app/config/navigation.ts`; only rendered on private paths.
- **`Topbar`** — top app bar with theme toggle and user menu.
- **`Card`** — primary container for sections inside private pages.
- **`Charts`** — recharts wrappers for the overview dashboard.
- **`Modal`**, **`Select`**, **`Accordion`** — reusable interaction primitives.
- **`FastActions`** — quick-action panel (currently commented in `RootLayout`).
- **`Logo`** — Vendlyhub branding component.

## Source Tree (Web)

```
app-web/src/
├── middleware.ts                     # edge auth gate
└── app/
    ├── layout.tsx                    # ThemeProvider + AuthProvider + conditional Topbar/Sidebar + Toaster
    ├── page.tsx                      # → OverviewPage
    ├── not-found.tsx                 # /_not-found
    ├── auth/callback/page.tsx        # OAuth landing
    ├── catalog/{preview, [slug]}/    # storefront
    ├── login/, register/, fast-onboarding/, onboarding-flow/, esqueci-senha/, redefinir-senha/
    ├── overview/, categories/, products/, orders/, profile/, establishment/
    ├── components/                   # 15+ UI components (see inventory)
    ├── config/                       # navigation.ts, assetTypes.ts
    ├── contexts/AuthContext.tsx
    ├── hooks/                        # useCart, useCatalog, useCatalogFilters, useToggleTheme
    ├── lib/                          # confetti, mobileSlug, pendingProductDraft, postOnboarding
    ├── services/                     # apiClient + per-domain services
    ├── styles/                       # globals.scss, grid layout, tokens
    ├── types/                        # catalog.ts, order.ts, product.ts
    └── utils/
```

## Data Flow

1. User opens a private route. `middleware.ts` checks the `auth-token` cookie — if missing, redirects to `/login?redirect=<path>`.
2. `RootLayout` wraps the app in `AuthProvider`. `checkAuth()` reads tokens from `localStorage`, calls `authService.refreshToken(...)` to obtain a fresh access token, then `profileService.getProfile()` for `/auth/me`. Both are mirrored back to `localStorage` and a `auth-token` cookie.
3. Form pages submit through their domain service (`authService`, `productService`, etc.) which delegates to `apiClient`. The Axios request interceptor adds `Authorization: Bearer ${accessToken}`.
4. The Axios response interceptor force-logs-out on 401 (and on specific 404s) by clearing `localStorage` + cookie via `forceClientLogout`. A `AUTH_INVALID_SESSION_EVENT` window event resets `AuthContext` state.
5. Public storefront pages under `/catalog/[slug]` skip auth entirely; they hit `GET /catalog/:slug` and `POST /catalog/:slug/orders`.

## Routing Rules (Required Reading)

`app-web/src/app/config/navigation.ts`:

- `ERouteType.PUBLIC` — exact public paths.
- `ERouteType.PRIVATE` — exact private paths.
- `PUBLIC_ROUTE_PREFIXES` — currently `['/catalog/']` for dynamic public segments (e.g. `/catalog/[slug]`).
- `mainNavigation` — Sidebar items: Resumo, Categorias, Produtos, Pedidos, Estabelecimento.

When you add a route:
- Public, no chrome → add the exact path to `ROUTES.PUBLIC` (or its prefix to `PUBLIC_ROUTE_PREFIXES`).
- Private, with Topbar+Sidebar → add the exact path to `ROUTES.PRIVATE`.

If you forget, `middleware.ts` will treat the path as “invalid” and either redirect to `/login` (unauthenticated) or rewrite to `/_not-found` (authenticated).

## Theming & Layout

- **`next-themes`** — `<ThemeProvider attribute="class" enableSystem defaultTheme="system">` in `RootLayout`.
- **Layout grid** — `styles/grid-layout.module.scss` provides `appLayout` / `container` / `content` classes used in `RootLayout` for the private shell.
- **Toaster** — `sonner` mounted at top-right with rich colors and mobile-aware offsets.

## Forms & Validation

- Each form page (`login`, `register`, `fast-onboarding`, `establishment`, `categories`, `products`, `profile`, `esqueci-senha`, `redefinir-senha`) ships a `schema.ts` (zod) consumed by `useForm` via `@hookform/resolvers/zod`.
- Validation errors are surfaced via the form library; HTTP/business errors come through `normalizeApiError` (in `apiClient.ts`) and `feedback.ts` for toasts.
- Multipart uploads (logo, avatar, product image) build a `FormData` and are submitted through the matching domain service.

## Performance & UX Notes

- **Turbopack dev** (`next dev --turbopack`) for fast local DX.
- **Static-file matcher** in middleware (`PUBLIC_STATIC_FILE` regex) bypasses auth for media and font requests.
- **Cookie + localStorage hybrid** — slightly redundant by design: `localStorage` is used by Axios in client components; the cookie is used by Next.js middleware on the edge.
- **`AuthProvider.checkAuth()` always force-refreshes** the access token on first mount, ensuring tokens remain short-lived without affecting UX much.
- **Route-based chrome rendering** avoids a flash of layout for public pages.

## Testing Strategy

There is no automated frontend test suite checked in (no `*.spec.tsx`/`*.test.tsx` files were detected at the time of scanning). Validation relies on:

- TypeScript + ESLint (`pnpm lint:web` → `next lint`).
- Manual / e2e validation against the backend integration suite (`app-backend/test/jest-e2e.json`).

Recommended next step: introduce React Testing Library + Vitest/Jest, plus Playwright for the public storefront and the auth/onboarding flow.

## Deployment Architecture

The frontend has no deployment configuration in the repository. Operational expectations:

- **Build:** `pnpm build:web` → `next build`.
- **Start:** `next start` (or any Next.js host: Vercel, Node container, etc.).
- **Required env:** `NEXT_PUBLIC_API_URL` pointing at the backend (used by `apiClient` and `googleLogin`). All public env vars must be `NEXT_PUBLIC_*` because they are inlined at build time by Next.js.
- **Recommended:** Run `app-web` and `app-backend` behind the same domain (or set the backend `FRONTEND_URL` to the SPA origin) so CORS + cookies work as expected.

## Key Risks / Notes

- **`console.log` of auth data** in `AuthContext.storeAuthData` (logs `accessToken`, `refreshToken`, and the user object). This is a security smell that should be removed before production deploys.
- **Tokens in `localStorage`** are vulnerable to XSS; consider HttpOnly cookies if a cookie-only flow becomes feasible.
- **Single-origin CORS** on the backend means the production frontend domain must match `FRONTEND_URL`.
- **No frontend test suite** — covered above.
- **Login redirect target is hard-coded to `/catalog/preview`** in `AuthContext.login`; document or make configurable if product flow changes.
- **`Charts` and `recharts` weight** — avoid loading on public pages.

---

_Generated using BMAD Method `document-project` workflow_
