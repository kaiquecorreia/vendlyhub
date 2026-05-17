# Vendlyhub Web - Component Inventory

**Date:** 2026-05-16
**Path:** `app-web/src/app/components/`

A catalog of reusable UI components in the web client, plus the cross-cutting non-component pieces (services, hooks, contexts) that pages compose.

## Conventions

- Components live as folders under `app-web/src/app/components/<Name>/` with their own `.module.scss` (when applicable). Single-file components are co-located at the same level (e.g. `OnboardingMascotVideo.tsx`).
- Domain widgets (forms, asset modals) keep their state local; cross-cutting concerns (auth, theming, toasts) live higher in the tree (`AuthContext`, `ThemeProvider`, `Toaster`).
- Forms in pages are validated with zod schemas co-located in `app/<route>/schema.ts` rather than centralized.

## UI Components (`app-web/src/app/components/`)

### Layout & shell

| Component | Path | Purpose | Notes |
|---|---|---|---|
| `Sidebar` | `Sidebar/` | Side navigation for authenticated pages | Driven by `mainNavigation` from `app/config/navigation.ts`; only rendered when `isPrivatePath(pathname)` is true |
| `Topbar` | `Topbar/` | Top app bar with theme toggle and user menu | Sister to `Sidebar` in the private shell |
| `Logo` | `Logo/` | Vendlyhub branding | Used by Topbar and various marketing surfaces |
| `OnboardingMascotVideo.tsx` | `OnboardingMascotVideo.tsx` | Animated mascot for onboarding flows | Single-file component |

### Data display

| Component | Path | Purpose |
|---|---|---|
| `Card` | `Card/` | Primary container for sections inside private pages |
| `Charts` | `Charts/` | Recharts wrappers for the overview dashboard |
| `FinanceTable` | `FinanceTable/` | Tabular display for asset/finance widgets |
| `orders/...` | `orders/` | Order-specific display widgets used by `/orders` |

### Interaction primitives

| Component | Path | Purpose |
|---|---|---|
| `Modal` | `Modal/` | Reusable modal dialog |
| `Select` | `Select/` | Reusable select control |
| `Accordion` | `Accordion/` | Reusable accordion control |
| `FastActions` | `FastActions/` | Quick-action panel (presently commented in `RootLayout`) |

### Domain widgets (asset/finance, legacy/onboarding-related)

| Component | Path | Purpose |
|---|---|---|
| `AddAssetForm` | `AddAssetForm/` | Form widget for adding assets (legacy/finance flow) |
| `AssetAllocationForm` | `AssetAllocationForm/` | Form widget for allocating assets across types |
| `AssetQuestions` | `AssetQuestions/` | Questionnaire-style asset survey |

> Note: the asset-related widgets and the corresponding `assetService.ts`, `assetAllocationService.ts`, `assetQuestionsService.ts` look like legacy artifacts from an earlier finance domain. They do not appear to participate in the current catalog/orders flow.

## Non-component cross-cutting pieces

These are not in `components/` but are necessary context for understanding the UI.

### Contexts (`app-web/src/app/contexts/`)

| Context | Provider | Exposes |
|---|---|---|
| `AuthContext` | `AuthProvider` (`AuthContext.tsx`) | `user`, `loading`, `login`, `logout`, `googleLogin`, `handleOAuthCallback`, `register`, `registerMinimal`, `refreshUser`. Mounted in `RootLayout`. |

### Hooks (`app-web/src/app/hooks/`)

| Hook | Purpose |
|---|---|
| `useCart` | Cart state for the public catalog/storefront |
| `useCatalog` | Fetches catalog data |
| `useCatalogFilters` | Manages filter state on the storefront |
| `useToggleTheme` | Light/dark toggle (uses `next-themes`) |

### Services (`app-web/src/app/services/`)

| Service | Purpose |
|---|---|
| `apiClient.ts` | Axios instance + Bearer-injecting request interceptor + 401-driven `forceClientLogout` response interceptor + `normalizeApiError` |
| `authService.ts` | Login, register, registerMinimal, refresh, logout, forgot/reset password, Google bootstrap |
| `authSession.ts` | `clearAuthSessionStorage`, `forceClientLogout`, `resolveCurrentPath`, `AUTH_INVALID_SESSION_EVENT` |
| `profileService.ts` | `GET /auth/me`, `PATCH /auth/me` |
| `categoryService.ts` | Categories CRUD |
| `productService.ts` | Products CRUD (multipart) |
| `orderService.ts` | Admin orders list + confirm |
| `catalogService.ts` | Public catalog browsing (used by both `/catalog/preview` and `/catalog/[slug]`) |
| `whatsappService.ts` | WhatsApp message URL builder |
| `feedback.ts` | Toast / error feedback helpers |
| `mediaUrl.ts` | Build absolute URLs for `/uploads/...` from `NEXT_PUBLIC_API_URL` |
| `mockCatalogService.ts`, `mockProductService.ts` | Offline mocks for design/dev |
| `assetService.ts`, `assetAllocationService.ts`, `assetQuestionsService.ts` | Legacy/finance widget data |

### Lib (`app-web/src/app/lib/`)

| Helper | Purpose |
|---|---|
| `confetti.ts` | Wraps `canvas-confetti` for onboarding success |
| `mobileSlug.ts` | Derive a slug from a phone/WhatsApp number |
| `pendingProductDraft.ts` | Persist in-progress product drafts (likely `localStorage`/`sessionStorage`) for onboarding continuity |
| `postOnboarding.ts` | Coordinated post-onboarding actions |

### Config (`app-web/src/app/config/`)

| File | Purpose |
|---|---|
| `navigation.ts` | `ERoutePath` enum, `ROUTES` map (PUBLIC vs PRIVATE), `PUBLIC_ROUTE_PREFIXES`, `mainNavigation` (Resumo, Categorias, Produtos, Pedidos, Estabelecimento) — single source of truth for routing |
| `assetTypes.ts` | Asset taxonomy (legacy/finance widgets) |

### Types (`app-web/src/app/types/`)

| File | Contents |
|---|---|
| `catalog.ts` | Catalog-related type definitions |
| `order.ts` | Order shape used by orders page and order widgets |
| `product.ts` | Product shape used by products page |

### Styles (`app-web/src/app/styles/`)

| File | Purpose |
|---|---|
| `globals.scss` | Global styles |
| `grid-layout.module.scss` | Class names used by `RootLayout` for the private shell (`.appLayout`, `.container`, `.content`) |
| Design-token files (variables, colors, etc.) | Project-wide visual language |

## Page-Level Forms (zod schemas)

Each form page co-locates a `schema.ts` with its `page.tsx`:

| Page | Schema |
|---|---|
| `/login` | `app/login/schema.ts` |
| `/register` | `app/register/schema.ts` |
| `/fast-onboarding` | `app/fast-onboarding/schema.ts` |
| `/establishment` | `app/establishment/schema.ts` |
| `/categories` | `app/categories/schema.ts` |
| `/products` | `app/products/schema.ts` |
| `/profile` | `app/profile/schema.ts` |
| `/esqueci-senha` | `app/esqueci-senha/schema.ts` |
| `/redefinir-senha` | `app/redefinir-senha/schema.ts` |

Forms are wired with `react-hook-form` + `@hookform/resolvers/zod`, submit handlers delegate to the matching domain service in `app-web/src/app/services/`.

## Adding a New Component

1. Create `app-web/src/app/components/<Name>/index.tsx` and (when needed) `<Name>.module.scss`.
2. Keep cross-cutting state out of the component; lift it to a context or hook.
3. If the component is a form, prefer co-locating a `schema.ts` and using `react-hook-form` + zod.
4. Submit data through an existing service in `app-web/src/app/services/` (or create a new one). Do not call `axios` directly from a component.
5. If the component is page-specific, prefer placing it inside the page folder rather than `components/`.

---

_Generated using BMAD Method `document-project` workflow_
