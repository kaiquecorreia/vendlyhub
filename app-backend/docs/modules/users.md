# Users module

**Path:** `src/modules/users/`

## Purpose

Owns **user identity** in the domain: creating users, looking them up by email or id, and updating basic profile fields. It does **not** expose HTTP controllers; other modules (especially **sessions**) call `UsersService`.

## Architecture

- **Entity:** `entities/user.entity.ts` — `User` with `userId`, `email`, `name`, `isActive`, `lastLoginAt`, timestamps; `passwordHash` is excluded from serialization where `class-transformer` applies.
- **Repository:** `repositories/user.repository.ts` defines `IUserRepository`; Prisma implementation: `repositories/prisma/prisma.user.repository.ts`.
- **Service:** `services/users.service.ts` — `create`, `findByEmail`, `findById` (throws `NotFoundException` if missing), `update`.

## Module contract

- **Exports:** `UsersService`
- **Imports:** none (only shared Prisma helpers registered locally: `PrismaService`, `ClsService`)

## Data model (Prisma)

Maps to the `User` model in `prisma/schema.prisma` (`@@map("user")`).

## Consumers

- **Sessions module** — registration, JWT validation (`JwtStrategy` loads user by id), login, Google auth, `GET /auth/me`
- **Register user use case** — creates the user record before establishment onboarding

## Related documentation

- [API consumer guide](../API_CONSUMER_GUIDE.md) — auth and profile over HTTP
- [Sessions module](sessions.md) — authentication flows
