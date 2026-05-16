# Contacts module

**Path:** `src/modules/contacts/`

## Purpose

Stores **contact channels** (phone, mobile, email, etc.) for **users** or **establishments**, using a polymorphic-style pattern (`ownerType` + `ownerId`) aligned with Prisma.

## Architecture

- **Entity:** `entities/contact.entity.ts`
- **Repository:** `repositories/contact.repository.ts` + Prisma implementation.
- **Service:** `services/contacts.service.ts` — `create`, `findByOwnerId`.

## Module contract

- **Exports:** `ContactsService`
- **Imports:** none (shared Prisma providers only)

## Data model (Prisma)

`Contact` model with `ContactType` enum (`phone_number`, `mobile_number`, `email`), `OwnerType` (`user`, `establishment`). Optional `userId` / `establishmentId` relations.

## Consumers

- **Sessions module** — `RegisterUserUseCase` may create establishment phone/mobile contacts during onboarding.

## Related documentation

- [Establishments module](establishments.md)
- [Sessions module](sessions.md)
