# Vendlyhub Backend - API Contracts

**Date:** 2026-05-16
**Source of truth (live):** Swagger UI at `${baseUrl}/api`
**Source of truth (narrative):** `app-backend/docs/API_CONSUMER_GUIDE.md`

This document is a generated quick reference. For request/response shapes with examples, error codes, and curl/JS snippets, see `app-backend/docs/API_CONSUMER_GUIDE.md`.

## Conventions

- All authenticated routes require `Authorization: Bearer <access_token>`.
- Default content type is `application/json`. Multipart is required where indicated (file uploads).
- Validation is enforced globally by NestJS' `ValidationPipe({ whitelist: true, transform: true })` — unknown fields are stripped.
- The full enum + payload shape for each request is captured by `class-validator` DTOs under `app-backend/src/modules/*/dto/`.

## Auth & session — `/auth` (`AuthController`)

Defined in `app-backend/src/modules/sessions/controllers/auth.controller.ts`.

| Method | Path | Auth | Body / Notes | Returns |
|---|---|---|---|---|
| `POST` | `/auth/register` | none | `application/json` or `multipart/form-data` (file field `logo`, JPEG/PNG/WebP, ≤ 2 MB). Required: `email`. Conditional establishment fields: `establishmentName`, `documentType`, `document`, `establishmentTypes[]`. Optional: `password`, `name`, `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`, `phone_number`, `mobile_number`. | If `password` provided: `{ access_token, refresh_token }`. Otherwise: `{ message }`. **Errors:** 409 if email exists. |
| `POST` | `/auth/register-minimal` | none | `multipart/form-data`. Required: `establishmentName`, `whatsapp`, `password`. Optional: `logo` (file), `pixCopyPaste`. | `{ access_token, refresh_token }`. |
| `POST` | `/auth/login` | none | `{ email, password }` | `{ access_token, refresh_token }`. **Errors:** 401 invalid credentials. |
| `POST` | `/auth/forgot-password` | none | `{ email }` | `{ message }`. Sends reset email when account exists. |
| `POST` | `/auth/reset-password` | none | `{ token, newPassword }` | `{ message }`. **Errors:** 401 invalid/expired/used token. |
| `POST` | `/auth/refresh` | none | `{ refresh_token }` | `{ access_token }`. **Note:** refresh token is not rotated. **Errors:** 401 invalid/expired/revoked. |
| `POST` | `/auth/logout` | Bearer | `{ refresh_token }` | `{ message }`. Revokes the matching `auth_token`. |
| `GET` | `/auth/me` | Bearer | – | Current user (`userId`, `name`, `email`, optional `establishment` block with `establishmentTypes` denormalized to a string array). |
| `PATCH` | `/auth/me` | Bearer | `multipart/form-data` (optional `avatar` file ≤ 2 MB). Editable fields per DTO. | Updated profile. |
| `PATCH` | `/auth/establishment` | Bearer | `application/json`. Editable fields per DTO. | Updated establishment. |
| `PATCH` | `/auth/establishment/pix` | Bearer | `{ pixCopyPaste }` | Updated establishment. |
| `PATCH` | `/auth/establishment/logo` | Bearer | `multipart/form-data` (file `logo`, JPEG/PNG/WebP, ≤ 2 MB). | Updated establishment. |
| `POST` | `/auth/onboarding/complete` | Bearer | – | Transitions `Establishment.onboardingStatus` to `completed`. |
| `GET` | `/auth/google` | none | – | 302 to Google's OAuth consent (only mounted when `GOOGLE_CLIENT_ID` is set). |
| `GET` | `/auth/google/callback` | none | – | 302 to `${FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...` on success or `${FRONTEND_URL}/login?error=auth_failed` on failure. |

## Categories — `/categories` (`CategoriesController`)

All routes are guarded by `JwtAuthGuard`.

| Method | Path | Body | Returns |
|---|---|---|---|
| `GET` | `/categories` | – | List of categories for the user's establishment. |
| `POST` | `/categories` | `CreateCategoryDto` | Created category. |
| `PATCH` | `/categories/:id` | `UpdateCategoryDto` | Updated category. |
| `DELETE` | `/categories/:id` | – | `{ message: 'Category deleted successfully' }`. Soft-deletes via `deletedAt`. |

DTOs live in `app-backend/src/modules/categories/dto/`.

## Products — `/products` (`ProductsController`)

All routes are guarded by `JwtAuthGuard`.

| Method | Path | Content type | Body / Query | Returns |
|---|---|---|---|---|
| `GET` | `/products` | – | `ListProductsQueryDto` (pagination, `categoryId`, `status`, `search`, sort) | Paginated product list. |
| `GET` | `/products/:id` | – | – | Product detail (only if owned by the user's establishment). |
| `POST` | `/products` | `multipart/form-data` | `CreateProductDto` + optional file `image` (JPEG/PNG/WebP, ≤ 5 MB) | Created product. SKU auto-generated when omitted; `categoryId` defaults to the establishment's `"Geral"` category if missing. |
| `PATCH` | `/products/:id` | `multipart/form-data` | `UpdateProductDto` + optional file `image` | Updated product. |
| `DELETE` | `/products/:id` | – | – | `{ message: 'Product deleted successfully' }` (soft delete). |

Source: `app-backend/src/modules/products/products.controller.ts`. The image interceptor enforces MIME `image/(jpeg|png|webp)` and a 5 MB size limit, storing files under `app-backend/uploads/products/` and persisting `imageUrl = '/uploads/products/<filename>'`.

## Public catalog — `/catalog` (`CatalogController` + `OrdersController`)

No auth. Used by the public storefront in `app-web/src/app/catalog/[slug]`.

| Method | Path | Body | Returns | Notes |
|---|---|---|---|---|
| `GET` | `/catalog/:slug` | – | Establishment + active products keyed off the slug. | `CatalogController` |
| `GET` | `/catalog/:slug/highlighted` | – | Subset of highlighted products. | `CatalogController` |
| `POST` | `/catalog/:slug/orders` | `CreateOrderDto` | Created order (status `pending`). | `OrdersController` (note: same `/catalog` prefix, different controller). |

`CreateOrderDto` (`app-backend/src/modules/orders/dto/create-order.dto.ts`) carries customer name, WhatsApp, address, notes, and the order items. Public order creation enters `OrderStatus.pending`.

## Admin orders — `/orders` (`OrdersAdminController`)

All routes are guarded by `JwtAuthGuard`.

| Method | Path | Body / Query | Returns |
|---|---|---|---|
| `GET` | `/orders` | `ListOrdersQueryDto` | Paginated orders for the user's establishment. |
| `PATCH` | `/orders/:id/confirm` | – | Order with `status` set to `confirmed`. |

## Static files — `/uploads/...`

Served by raw Express static middleware mounted before NestJS routes. Three subfolders are auto-created on bootstrap:

- `/uploads/logos/...`
- `/uploads/avatars/...`
- `/uploads/products/...`

Stored values on entities are URL paths (e.g. `Product.imageUrl = '/uploads/products/<file>.jpg'`); clients build absolute URLs by prefixing the API base.

## Swagger / OpenAPI

`@nestjs/swagger` builds an OpenAPI doc on startup with Bearer auth declared. UI is available at `${baseUrl}/api`. Run-time `setTitle('Vendlyhub API')` is set in `app-backend/src/main.ts`.

> Note: the description string in `main.ts` (`'API for managing investment portfolios'`) is legacy and does not reflect the current scope.

## Error model

| Status | Meaning |
|---|---|
| 200 | Success (most write actions also return 200 here, not 201). |
| 400 | Validation failure (class-validator) or bad request. |
| 401 | Missing/invalid Bearer token, invalid credentials, expired/revoked refresh token. |
| 404 | Not found; some 404s with the message `"user not found"` cause the web client to force-logout (see `app-web/.../apiClient.ts`). |
| 409 | Conflict — e.g. duplicate email on register. |

Validation errors return a structured JSON body shaped like `{ statusCode, message: string | string[], error }`. The web client uses `normalizeApiError` to surface the first message.

## Where to look in the codebase

- Routes / handlers: `app-backend/src/modules/*/[*.]controller.ts`
- DTOs / validation: `app-backend/src/modules/*/dto/*.ts`
- Auth guards: `app-backend/src/modules/sessions/guards/*.ts`
- JWT config: `app-backend/src/modules/sessions/sessions.module.ts` (1h access tokens, secret from `JWT_SECRET`)
- Refresh-token issuance: `app-backend/src/modules/sessions/use-cases/login-with-token.usecase.ts` (7-day expiry)
- Multer / uploads: `app-backend/src/upload-paths.ts` and the per-controller `FileInterceptor` blocks
- Module-by-module narrative: `app-backend/docs/modules/` (`users.md`, `sessions.md`, `establishments.md`, `addresses.md`, `contacts.md`, `products.md`)

---

_Generated using BMAD Method `document-project` workflow_
