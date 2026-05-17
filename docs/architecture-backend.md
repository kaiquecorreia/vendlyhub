# Vendlyhub Backend - Architecture

**Date:** 2026-05-16
**Part:** `app-backend`
**Project Type:** backend (NestJS REST API)

## Executive Summary

`app-backend` is a NestJS 11 modular monolith exposing a REST API over Express 5, with PostgreSQL persistence through Prisma 7. It is responsible for authentication (JWT + refresh tokens, optional Google OAuth), establishment onboarding, the catalog domain (categories, products), and orders (public creation by buyers, admin listing/confirmation by establishment owners). The application also serves uploaded files (logos, avatars, product images) as static assets at `/uploads/...` and publishes its OpenAPI surface via Swagger UI at `/api`.

## Technology Stack

| Category | Technology | Version | Justification |
|---|---|---|---|
| Framework | NestJS | 11.0.x (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`) | Modular DI, decorators, guards, interceptors and pipes; first-class testing support |
| HTTP server | Express | 5.2.1 | Adapter chosen so a raw static middleware can be mounted before Nest routes for `/uploads` |
| Language | TypeScript | 5.7 (compiled to CommonJS — `"type": "commonjs"` in package.json) | Strict typing; matches Nest CLI defaults |
| ORM | Prisma | 7.3 (`@prisma/client`, `@prisma/adapter-pg`) | Type-safe DB access, migration tooling |
| Database | PostgreSQL | 18.1 (Docker image `postgres:18.1`) | Primary persistence, only Prisma talks to it |
| Auth | `@nestjs/jwt` 11, `@nestjs/passport` 11, `passport-jwt` 4, `passport-local` 1, `passport-google-oauth20` 2, `bcrypt` 6 | – | JWT access tokens (1h), refresh tokens (UUID, 7d hashed), local password strategy, optional Google OAuth |
| Validation | `class-validator` 0.14, `class-transformer` 0.5 (global `ValidationPipe({ whitelist, transform })`) | – | DTO validation, request whitelisting |
| OpenAPI | `@nestjs/swagger` 11.2 | – | Swagger UI at `/api`, Bearer auth declared in `main.ts` |
| Uploads | `multer` 2.1 | – | `FileInterceptor` with disk storage; size and MIME constraints per route |
| Email | `nodemailer` 8.0 | – | Password-reset emails (`MailService` in `sessions`) |
| Misc | `dotenv` 17, `rxjs` 7, `reflect-metadata` 0.2, `uuid` 13 | – | Runtime utilities |
| Testing | `jest` 29, `ts-jest` 29, `supertest` 7 | – | Unit (`*.spec.ts`), integration (`*.integration.spec.ts`), e2e (`test/jest-e2e.json`) |
| Build | `nest build`, `swc/cli`, `swc/core` | – | Standard Nest build pipeline |

**Architectural Style:** Modular monolith. Each NestJS feature module owns its controller(s), services, DTOs, entities, and (where applicable) repository abstractions and use-cases. Cross-module dependencies are explicit via Nest DI imports.

## Architecture Pattern

- **Layered request flow:** `Controller` → (Guard) → `Use-case` / `Service` → `Repository` (interface) → Prisma adapter → PostgreSQL.
- **Repository pattern (where adopted):** Modules like `sessions`, `users`, `establishments`, `addresses`, `contacts` define repository interfaces (`*.repository.ts` with a string DI token) and Prisma adapters under `repositories/prisma/`. Modules without that split (e.g. `categories`, `products`, `catalog`, `orders`) call `PrismaService` directly from their service.
- **Use-case driven orchestration in `sessions` and `users`:** Each user-facing action (register, login, refresh, logout, OAuth, password-reset request, password-reset apply, validate user) is a single class under `use-cases/`, keeping `SessionsService` slim and the controller lean.
- **Two HTTP surfaces inside one app:**
  - **Authenticated admin** routes under `/auth/*` (mostly self-management endpoints), `/products`, `/categories`, `/orders` — all guarded by `JwtAuthGuard`.
  - **Public storefront** routes under `/catalog/*` (no guard) — used by buyers without an account.
- **Static file middleware before Nest** — In `main.ts`, an Express `static('/uploads', UPLOADS_ROOT)` is registered on the underlying server before `NestFactory.create(...)` mounts routes. This is intentional: Nest's catch-all 404 would otherwise shadow file requests.
- **Conditional providers** — `GoogleStrategy` is only registered when `GOOGLE_CLIENT_ID` is present in the environment, so deployments without Google OAuth do not need the credentials.

## Module Inventory

All modules live under `app-backend/src/modules/`.

| Module | Path | Public surface | Notes |
|---|---|---|---|
| **Sessions** (auth) | `modules/sessions/` | `POST /auth/register`, `POST /auth/register-minimal`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`, `PATCH /auth/me`, `PATCH /auth/establishment`, `PATCH /auth/establishment/pix`, `PATCH /auth/establishment/logo`, `POST /auth/onboarding/complete`, `GET /auth/google`, `GET /auth/google/callback` | Owns auth lifecycle. Has `use-cases/`, `strategies/`, `guards/`, `repositories/` (auth-token, auth-provider, password-reset-token) with Prisma adapters, `services/sessions.service.ts`, and `services/mail.service.ts`. Exports `SessionsService`, `JwtAuthGuard`. |
| **Users** | `modules/users/` | (no controller — used by other modules) | Provides user creation/lookup use-cases consumed by `sessions`. |
| **Establishments** | `modules/establishments/` | (no controller) | Establishment domain + repository; consumed by `sessions` and `auth.controller` for establishment edits. |
| **Addresses** | `modules/addresses/` | (no controller) | Address entity + repository; used during register and establishment edit. |
| **Contacts** | `modules/contacts/` | (no controller) | Polymorphic owner contacts (user / establishment) — emails, phones, mobile/WhatsApp. |
| **Categories** | `modules/categories/` | `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` (all `@UseGuards(JwtAuthGuard)`) | Establishment-scoped CRUD. |
| **Products** | `modules/products/` | `GET /products`, `GET /products/:id`, `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` (all guarded; multipart for create/update with optional `image` file ≤5 MB JPEG/PNG/WebP) | Auto-creates default `"Geral"` category, soft-deletes via `deletedAt`, generates SKU when omitted. |
| **Catalog** (public) | `modules/catalog/` | `GET /catalog/:slug`, `GET /catalog/:slug/highlighted` | No auth. Used by the public storefront (`app-web/src/app/catalog/[slug]`). |
| **Orders** | `modules/orders/` | `POST /catalog/:slug/orders` (public, `OrdersController`); `GET /orders`, `PATCH /orders/:id/confirm` (admin, `OrdersAdminController`) | Public order creation by buyer; admin listing/confirmation. |

`AppModule` (`src/app.module.ts`) is the root composition root and only imports those feature modules; it has no controllers or providers of its own.

## Source Tree (Backend)

```
app-backend/src/
├── main.ts                      # bootstrap(): static /uploads (pre-Nest), CORS, ValidationPipe, Swagger, listen(PORT)
├── app.module.ts                # imports all feature modules
├── upload-paths.ts              # UPLOADS_ROOT, LOGOS/AVATARS/PRODUCTS_UPLOAD_DIR
├── __mocks__/uuid.ts            # Stable UUIDs for jest
├── docs/                        # in-source docs (legacy)
├── modules/
│   ├── addresses/               # entities/, repositories/ (interface + prisma), services/
│   ├── catalog/                 # controller + service + integration spec
│   ├── categories/              # controller + service + dto/
│   ├── contacts/                # entities/, repositories/, services/
│   ├── establishments/          # entities/, repositories/, services/
│   ├── orders/                  # orders.controller (public) + orders-admin.controller (admin) + service + dto/
│   ├── products/                # controller + service + dto/ (multer FileInterceptor)
│   ├── sessions/                # auth — controllers/, dto/, entities/, guards/, repositories/{,prisma}, services/, strategies/, use-cases/, utils/
│   └── users/                   # users.module + repositories/ + services/ + use-cases/
└── shared/
    ├── prisma/                  # PrismaService, ClsService, TransactionService
    ├── constants/
    ├── types/
    └── utils/
```

See [source-tree-analysis.md](./source-tree-analysis.md) for the full annotated tree.

## Authentication & Authorization

### Local (email/password) flow
1. **Register** — `POST /auth/register` (JSON or `multipart/form-data` with `logo`). `RegisterUserUseCase` runs in a `TransactionService` to create `User` (hashing the password with `bcrypt`), and, when the establishment fields are present, creates `Establishment` + `Address` + initial `Contact`s and links via `UserEstablishment`. If a password was provided, returns `{ access_token, refresh_token }`; otherwise returns a success message without tokens.
2. **Login** — `POST /auth/login` with `{ email, password }`. `LocalStrategy` validates credentials via `ValidateUserUseCase`. `LoginUserUseCase` issues an access JWT (signed with `JWT_SECRET`, `expiresIn: '1h'`) and a UUID refresh token whose `bcrypt` hash is stored in `auth_token` with a 7-day `expires_at`.
3. **Refresh** — `POST /auth/refresh` with `{ refresh_token }`. `RefreshAccessTokenUseCase` looks up the matching `auth_token` row by hash, ensures it is unrevoked and unexpired, and returns a new access token. The refresh token itself is not rotated.
4. **Logout** — `POST /auth/logout` (Bearer access + body `refresh_token`). `LogoutUserUseCase` revokes the matching `auth_token` (`revokedAt = now`).
5. **Profile / `me`** — `GET /auth/me` returns the user plus optional `establishment` (with `establishmentTypes` denormalized to a string array).
6. **Password reset** — `POST /auth/forgot-password` issues a hashed `password_reset_token` and sends an email (`MailService`). `POST /auth/reset-password` consumes it.

### Google OAuth (optional)
Registered only when `GOOGLE_CLIENT_ID` is set. `GET /auth/google` starts the flow; `GET /auth/google/callback` redirects the browser to `${FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...` (or to `/login?error=auth_failed`).

### Guards
- **`JwtAuthGuard`** — applied per-controller (e.g. `@UseGuards(JwtAuthGuard)` on `ProductsController`, `CategoriesController`, `OrdersAdminController`, and individual handlers in `AuthController`). Reads `Authorization: Bearer ...` and populates `req.user.userId` (from `JwtStrategy.validate`).
- **`LocalAuthGuard`** — used by the login route to drive `LocalStrategy.validate`.

### Tokens at rest
- `auth_token.refresh_token_hash` — bcrypt hash of the UUID refresh token; never the plaintext.
- `password_reset_token.reset_token_hash` — same convention.
- `user.password_hash` — bcrypt hash of user passwords.

## Validation

A global `ValidationPipe({ whitelist: true, transform: true })` is registered in `main.ts`. Every request body must pass through a DTO with `class-validator` decorators; unknown properties are stripped, and the `transform: true` flag converts plain objects into DTO instances and applies type coercion (e.g. `string -> Date`). Examples:

- `register.dto.ts` — register request fields.
- `create-product.dto.ts` / `update-product.dto.ts` — product CRUD.
- `list-products-query.dto.ts` — list filters with pagination, search, sort.
- `create-order.dto.ts` — public order creation body.

## File Uploads

Uploads use `multer` `diskStorage` with stable directory targets defined in `src/upload-paths.ts`:
- `UPLOADS_ROOT/logos/` — establishment logos (`PATCH /auth/establishment/logo`, `POST /auth/register` multipart).
- `UPLOADS_ROOT/avatars/` — user avatars (`PATCH /auth/me`).
- `UPLOADS_ROOT/products/` — product images (`POST /products`, `PATCH /products/:id`).

Each `FileInterceptor` enforces `fileFilter` (MIME regex like `^image\/(jpeg|png|webp)$`) and `limits.fileSize` (2 MB for logos/avatars, 5 MB for product images). The persisted column on each entity stores a URL path like `/uploads/products/<unique-name>.<ext>`.

`bootstrap()` calls `mkdirSync(...{ recursive: true })` for all three directories before Nest mounts. The static middleware that serves them is registered on the underlying Express instance before `NestFactory.create(...)`.

## CORS, Bootstrap and Swagger

`main.ts`:

```typescript
const server = express();
server.use('/uploads', express.static(UPLOADS_ROOT));
const adapter = new ExpressAdapter(server);
const app = await NestFactory.create<NestExpressApplication>(AppModule, adapter);

app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,
});

app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

const config = new DocumentBuilder()
  .setTitle('Vendlyhub API')
  .setDescription('API for managing investment portfolios') // historical description; current scope is establishment + catalog + orders
  .setVersion('1.0')
  .addBearerAuth()
  .build();
SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

await app.listen(process.env.PORT ?? 3000);
```

Swagger UI is reachable at `${baseUrl}/api`.

## Data Architecture

The single source of truth is `app-backend/prisma/schema.prisma`. The 12 models are:

- **`User`** + **`AuthProvider`** + **`AuthToken`** + **`PasswordResetToken`** — identity, OAuth links, refresh tokens, password resets.
- **`Establishment`** + **`EstablishmentType`** + **`EstablishmentEstablishmentType`** — establishments with many-to-many types (e.g. `Restaurantes`, `Pizzarias`).
- **`Address`** — referenced 1:N by `Establishment.addressId`.
- **`Contact`** — polymorphic owner (`OwnerType` = `user | establishment`) with `ContactType` (`phone_number | mobile_number | email`).
- **`UserEstablishment`** — N:M membership with `UserRole` (`owner | admin | staff`) and onboarding flags (`loginWhatsapp`, `minimalProfileCompleted`).
- **`Category`** — establishment-scoped categories with `CategoryStatus`.
- **`Product`** — establishment + category-scoped with stock, pricing, image, and soft-delete (`deletedAt`).
- **`Order`** + **`OrderItem`** — orders placed by buyers from the public storefront, linked back to `Establishment` and `Product`.

Enums: `AuthProviderType`, `DocumentType`, `OwnerType`, `ContactType`, `UserRole`, `CategoryStatus`, `ProductStatus`, `OrderStatus`, `OnboardingStatus`.

See [data-models-backend.md](./data-models-backend.md) for the full schema with relations, indexes, and per-model notes.

## API Design

The full endpoint catalog (with request/response shapes, content types, error codes, and curl/JS examples for the auth subset) is in:

- [api-contracts-backend.md](./api-contracts-backend.md) — generated catalog
- `app-backend/docs/API_CONSUMER_GUIDE.md` — narrative consumer guide (existing, authoritative for auth)

Quick map of the routes mounted by each controller:

| Controller | Path prefix | Routes |
|---|---|---|
| `AuthController` | `/auth` | `register`, `register-minimal`, `login`, `forgot-password`, `reset-password`, `refresh`, `logout`, `me` (GET/PATCH), `establishment/pix` (PATCH), `establishment/logo` (PATCH), `establishment` (PATCH), `onboarding/complete` (POST), `google` (GET), `google/callback` (GET) |
| `CategoriesController` | `/categories` | GET (list), POST (create), PATCH `:id`, DELETE `:id` |
| `ProductsController` | `/products` | GET (list with filters), GET `:id`, POST (multipart), PATCH `:id` (multipart), DELETE `:id` |
| `CatalogController` (public) | `/catalog` | GET `:slug`, GET `:slug/highlighted` |
| `OrdersController` (public) | `/catalog` | POST `:slug/orders` |
| `OrdersAdminController` | `/orders` | GET (list, JWT-guarded), PATCH `:id/confirm` |

Note: `OrdersController` and `CatalogController` share the `/catalog` prefix but expose different verbs and handlers.

## Component Overview

This is a backend service; “components” are NestJS providers. The salient ones:

- **Controllers:** `AuthController`, `CategoriesController`, `ProductsController`, `CatalogController`, `OrdersController`, `OrdersAdminController`.
- **Services:** `SessionsService`, `MailService`, `CategoriesService`, `ProductsService`, `CatalogService`, `OrdersService`, plus per-entity services in users/establishments/addresses/contacts.
- **Use-cases (sessions):** `RegisterUserUseCase`, `LoginUserUseCase`, `LoginWithTokenUseCase`, `RefreshAccessTokenUseCase`, `LogoutUserUseCase`, `GoogleAuthUseCase`, `RequestPasswordResetUseCase`, `ResetPasswordUseCase`, `ValidateUserUseCase`.
- **Strategies:** `JwtStrategy`, `LocalStrategy`, optional `GoogleStrategy`.
- **Guards:** `JwtAuthGuard`, `LocalAuthGuard`.
- **Repositories (interface tokens + Prisma adapters):** `AUTH_TOKEN_REPOSITORY`, `AUTH_PROVIDER_REPOSITORY`, `PASSWORD_RESET_TOKEN_REPOSITORY`, plus user/establishment/address/contact repositories in their respective modules.
- **Shared providers:** `PrismaService`, `ClsService`, `TransactionService`.

## Development Workflow

From the repository root:

```bash
pnpm install
docker compose up -d
pnpm dev:backend
```

Useful per-app scripts (run inside `app-backend/` or via `pnpm --filter vendlyhub-backend ...`):

| Command | Purpose |
|---|---|
| `pnpm start:dev` | `nest start --watch` |
| `pnpm start:debug` | `nest start --debug --watch` |
| `pnpm start:prod` | `node dist/src/main.js` |
| `pnpm build` | runs `prisma generate` then `nest build` |
| `pnpm lint` | runs `prisma generate` then `eslint --fix` |
| `pnpm test` / `test:watch` / `test:cov` | Jest suites |
| `pnpm test:e2e` | Jest with `test/jest-e2e.json` |
| `pnpm prisma:generate` / `prisma:migrate:dev` / `prisma:migrate:deploy` / `prisma:studio` | Prisma tooling |

`prebuild`, `prelint`, and `pretest` all force `prisma:generate` to keep the Prisma client in sync.

## Deployment Architecture

Production deployment is not codified in the repository (no Dockerfile or CI workflows are present). The runtime expectations the code makes:

- **Runtime:** Node.js (root pin: 24.13.0).
- **Process:** `node dist/src/main.js` (after `nest build`).
- **Required env:** `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`. Optional: `PORT` (default 3000), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`.
- **Database:** PostgreSQL ≥ 18 (the local image is `postgres:18.1`).
- **Filesystem:** writeable `app-backend/uploads/` directory, or replace the static middleware with object storage if running in a stateless environment.
- **Reverse proxy / TLS / secret management** are external concerns.

See [deployment-guide.md](./deployment-guide.md) for the local Docker setup that ships with the repo.

## Testing Strategy

- **Unit tests** — `*.spec.ts` next to source (e.g. `app.module.spec.ts`, `users.service.spec.ts`, `categories.controller.integration.spec.ts`). Jest config in `package.json` (`rootDir = src`, `testRegex = .*\.spec\.ts$`).
- **Integration tests** — files like `categories.controller.integration.spec.ts`, `auth.integration.spec.ts`, `auth.controller.file-upload.spec.ts`, `orders.controller.integration.spec.ts`. They drive the controllers with NestJS testing utilities and (where relevant) a real or mocked Prisma layer.
- **E2E** — `pnpm test:e2e` uses `test/jest-e2e.json`.
- **Mocks** — `src/__mocks__/uuid.ts` enforces stable IDs for token generation in tests.
- Coverage report is written to `app-backend/coverage/` (also declared as a Turbo `test` task output).

## Cross-Cutting Concerns

- **Transactional writes** — `TransactionService` (in `shared/prisma/`) wraps multi-step writes; required for `RegisterUserUseCase` (user + establishment + address + contacts) so the operation is atomic.
- **Soft delete** — `Establishment`, `Category`, and `Product` carry `deletedAt`; respect it in list queries.
- **Slug-based public catalog** — `Establishment` exposes a slug to drive `/catalog/:slug` (see `prisma/migrations/20260511015000_catalog_mobile_number_slug`). The public surface never trusts the JWT — it only resolves by slug.
- **Onboarding state machine** — `Establishment.onboardingStatus` ∈ `{ draft, minimal_completed, completed }` and `UserEstablishment.minimalProfileCompleted` drive UI gating; `POST /auth/onboarding/complete` is the explicit transition.
- **Conditional Google OAuth** — see `sessions.module.ts`: the strategy is only added to providers when `GOOGLE_CLIENT_ID` is set.
- **Static-before-Nest middleware** — see `main.ts`: putting `express.static('/uploads')` on the underlying server before Nest is required so the Nest catch-all 404 handler does not shadow file requests.

## Key Risks / Notes

- **CORS allows a single origin** (`FRONTEND_URL`); deploying multi-origin clients requires extending this.
- **Refresh tokens are not rotated** on `POST /auth/refresh` (only the access token changes). Add rotation if higher security is required.
- **Local file storage** for uploads couples instances to a writeable disk; behind a reverse proxy or CDN, swap to object storage.
- **Swagger description** in `main.ts` still says “API for managing investment portfolios” (legacy); update if the public OpenAPI spec is exposed externally.
- **Mixed module patterns** — some modules adopted the repository + use-case split; others (categories, products, catalog, orders) talk to Prisma from their service. Keep this in mind when contributing.

---

_Generated using BMAD Method `document-project` workflow_
