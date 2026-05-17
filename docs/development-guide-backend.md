# Vendlyhub Backend - Development Guide

**Date:** 2026-05-16
**Path:** `app-backend/`

How to set up, run, test, and contribute to the NestJS REST API.

## Prerequisites

- **Node.js 24.13.0** (root `.nvmrc` pin). The app-level `app-backend/.nvmrc` matches; `app-backend/package.json` does not declare engines but should work on any 22+ runtime locally.
- **pnpm 10.27.0** (declared as `packageManager` in the root `package.json`).
- **Docker** (for the local PostgreSQL container declared in `docker-compose.yml`).

## Environment Variables

Set in `app-backend/.env` (already present in the repo with dev values).

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Prisma connection string (e.g. `postgresql://gandalf:gandalf123@localhost:5439/vendlyhub`) |
| `JWT_SECRET` | Yes | Signs access JWTs (1h expiry) |
| `FRONTEND_URL` | Recommended | CORS origin (default `http://localhost:3001`); also used for OAuth success/error redirects |
| `PORT` | No | HTTP listen port (default `3000`) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | Conditional | If `GOOGLE_CLIENT_ID` is set, `GoogleStrategy` is registered and `/auth/google` + `/auth/google/callback` become active |

Email-related variables for `nodemailer` (used by `MailService` in the password-reset flow) should be added to `.env` per your SMTP provider.

## Install

From the repository root:

```bash
pnpm install
```

## Local database

Run PostgreSQL via Docker Compose from the repo root:

```bash
docker compose up -d
```

This starts `postgres:18.1` on host port `5439` (container `5432`) with database `vendlyhub`, user `gandalf`, password `gandalf123`. The image has a healthcheck (`pg_isready -U gandalf -d vendlyhub`).

## Run in development

From the repo root (preferred):

```bash
pnpm dev:backend
```

Or directly inside `app-backend/`:

```bash
pnpm start:dev      # nest start --watch
pnpm start:debug    # nest start --debug --watch
```

The bootstrap (`src/main.ts`) creates the `uploads/{logos,avatars,products}` directories, mounts `/uploads` static middleware on the underlying Express server, configures CORS, registers the global `ValidationPipe`, sets up Swagger at `/api`, and listens on `PORT` (default `3000`).

Once running, browse:

- `http://localhost:3000/api` — Swagger UI (Bearer auth supported in the UI).
- `http://localhost:3000/uploads/...` — static files.

## Build & start (production-style)

```bash
pnpm build:backend                          # prisma generate + nest build
pnpm --filter vendlyhub-backend start:prod  # node dist/src/main.js
```

`turbo` declares `dist/**` as the build output.

## Lint & format

```bash
pnpm lint:backend                              # prisma generate + eslint --fix
pnpm --filter vendlyhub-backend format         # prettier --write src/ test/
```

ESLint configuration: `app-backend/eslint.config.mjs` (typescript-eslint + Prettier integration).

## Tests

```bash
pnpm test:backend                              # prisma generate + jest
pnpm --filter vendlyhub-backend test:watch
pnpm --filter vendlyhub-backend test:cov       # writes coverage/
pnpm --filter vendlyhub-backend test:e2e       # uses test/jest-e2e.json
```

- Jest config in `app-backend/package.json` (rootDir = `src`, `testRegex = .*\.spec\.ts$`).
- `*.spec.ts` files are next to source. Integration tests use the suffix `*.integration.spec.ts`.
- `src/__mocks__/uuid.ts` provides stable UUIDs for token/test stability.
- `prebuild`, `prelint`, and `pretest` all force `prisma:generate` to keep the Prisma client in sync.

## Prisma

Useful scripts (run from `app-backend/` or via pnpm filter):

```bash
pnpm --filter vendlyhub-backend prisma:generate
pnpm --filter vendlyhub-backend prisma:migrate:dev    # apply + create migrations
pnpm --filter vendlyhub-backend prisma:migrate:deploy
pnpm --filter vendlyhub-backend prisma:studio
```

Schema lives at `app-backend/prisma/schema.prisma`. Migrations are append-only under `app-backend/prisma/migrations/`. A manual reset SQL exists at `app-backend/prisma/reset-initial-state.sql`.

For creating a new migration:

```bash
pnpm --filter vendlyhub-backend prisma:migrate:dev --name <change>
```

See [data-models-backend.md](./data-models-backend.md) for a full model walkthrough.

## Adding a Feature Module

For a thin CRUD module (follow `categories` or `products`):

1. `nest g module <name>` (run inside `app-backend/`).
2. Add the module to `src/app.module.ts`'s `imports`.
3. Create:
   - `<name>.controller.ts` with `@Controller('<route>')`, `@UseGuards(JwtAuthGuard)` if authenticated, and route handlers.
   - `<name>.service.ts` calling `PrismaService` directly.
   - `dto/` with `class-validator` decorators on request DTOs.
4. Optionally add `*.spec.ts` and `*.integration.spec.ts`.

For a richer module with use-cases and repository abstraction (follow `sessions` or `users`):

1. Add `repositories/<thing>.repository.ts` (interface + DI string token).
2. Add `repositories/prisma/prisma.<thing>.repository.ts` (adapter implementing the interface against `PrismaService`).
3. Bind in the module's `providers`: `{ provide: <THING_REPOSITORY>, useClass: PrismaXxxRepository }`.
4. Implement business actions as `use-cases/<verb-thing>.usecase.ts` classes; inject the repository token.
5. Keep the controller thin (`req` + DTO → use-case → response).

## Authentication conventions

- Protect handlers with `@UseGuards(JwtAuthGuard)`. The strategy maps the JWT subject to `req.user.userId`.
- For login-only routes use `@UseGuards(LocalAuthGuard)`.
- Issue tokens through `LoginUserUseCase` / `LoginWithTokenUseCase`. Refresh-token records are stored in `auth_token` with the bcrypt hash of the UUID and a 7-day expiry.
- Never persist plaintext credentials/tokens. Use `bcrypt` (already imported in `sessions`).

## File uploads

To accept uploads:

1. Add a directory constant to `src/upload-paths.ts` and ensure `bootstrap()` calls `mkdirSync(<dir>, { recursive: true })` for it.
2. Use `FileInterceptor` with `diskStorage({ destination, filename })` and a `fileFilter` that validates MIME types.
3. Set `limits.fileSize` (existing routes use 2 MB for images attached to users/establishments and 5 MB for products).
4. Persist a URL path like `/uploads/<dir>/<filename>` on the entity.

## Validation conventions

- All DTOs go under `<module>/dto/`.
- Use `class-validator` decorators (`@IsEmail`, `@IsString`, `@MinLength`, `@IsEnum`, `@IsOptional`, etc.).
- Use `class-transformer` (`@Type(() => Number)`, `@Transform`) when DTOs receive form fields rather than JSON.
- Don't disable the global `ValidationPipe`. If a controller takes raw form data, configure the DTO to use `@Type` for type coercion.

## Tests conventions

- Unit-test services and use-cases with mocked repositories (`jest.fn()`).
- Integration-test controllers using `@nestjs/testing` `Test.createTestingModule(...).compile()` and `request(app.getHttpServer())` (supertest). Mock Prisma where appropriate.
- Use `src/__mocks__/uuid.ts` for stable UUIDs in token-related tests.
- Coverage is written to `app-backend/coverage/` (also a Turbo `test` output).

## Troubleshooting

- **`/uploads/...` returns 404** — ensure `main.ts` mounts the static middleware on the raw Express server before `NestFactory.create(...)`. Putting it in a Nest module would let Nest's catch-all handler shadow it.
- **JWT validation always fails** — check `JWT_SECRET` matches between issuance and verification (both are read from `process.env.JWT_SECRET` in `sessions.module.ts`).
- **Google OAuth disabled** — `GoogleStrategy` is only added when `GOOGLE_CLIENT_ID` is set. The `/auth/google*` routes will be unreachable otherwise.
- **CORS errors** — `FRONTEND_URL` must match the SPA origin (scheme + host + port).
- **Prisma client out of date** — run `pnpm --filter vendlyhub-backend prisma:generate` (or just `pnpm build:backend`).
- **DB connection failure** — verify the container is up (`docker compose ps`), the `DATABASE_URL` port matches `5439`, and the database name is `vendlyhub`.

---

_Generated using BMAD Method `document-project` workflow_
