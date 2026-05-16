# Sessions module

**Path:** `src/modules/sessions/`

## Purpose

Handles **authentication and session lifecycle**: password login, JWT access tokens, refresh tokens (stored hashed), logout, optional **Google OAuth**, and the **`AuthController`** HTTP API under `/auth`.

## HTTP API

All public routes are implemented here. For request/response details, examples, and CORS, see [API_CONSUMER_GUIDE.md](../API_CONSUMER_GUIDE.md). Swagger UI: `/api`.

| Area | Contents |
|------|----------|
| Controller | `controllers/auth.controller.ts` — `register`, `login`, `refresh`, `logout`, `me`, `google`, `google/callback` |
| DTOs | `dto/register.dto.ts`, `dto/login.dto.ts` |
| Guards | `JwtAuthGuard`, `LocalAuthGuard` |
| Strategies | `JwtStrategy`, `LocalStrategy`, optional `GoogleStrategy` if `GOOGLE_CLIENT_ID` is set |

## Use cases

`use-cases/` orchestrates domain rules:

- `register-user.usecase.ts` — user creation + optional establishment/address/contacts (uses `TransactionService`)
- `login-user.usecase.ts`, `login-with-token.usecase.ts` — issue `access_token` + `refresh_token`
- `refresh-access-token.usecase.ts`, `logout-user.usecase.ts`
- `google-auth.usecase.ts`, `validate-user.usecase.ts`

## Services and repositories

- **SessionsService** — refresh token rows (`AuthToken`) and OAuth provider links (`AuthProvider`); `repositories/auth-token.repository.ts`, `auth-provider.repository.ts` with Prisma adapters.

## JWT configuration

Configured in `sessions.module.ts`: access tokens use `JWT_SECRET`, default expiry **1h** (`signOptions.expiresIn`). Refresh tokens are opaque UUIDs with **7-day** expiry in the database (see `login-with-token.usecase.ts`).

## Module contract

- **Exports:** `SessionsService`, `JwtAuthGuard`
- **Imports:** `UsersModule`, `AddressesModule`, `EstablishmentsModule`, `ContactsModule`, `PassportModule`, `JwtModule`

## Data model (Prisma)

`AuthToken`, `AuthProvider` (see `prisma/schema.prisma`).

## Related documentation

- [Users module](users.md), [Establishments module](establishments.md) — data used by registration and `me`
- [API consumer guide](../API_CONSUMER_GUIDE.md)
