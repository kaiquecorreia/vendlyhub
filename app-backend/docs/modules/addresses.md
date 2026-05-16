# Addresses module

**Path:** `src/modules/addresses/`

## Purpose

Creates and persists **physical addresses** as reusable records. Addresses are referenced by **establishments** (each establishment has an `addressId`).

## Architecture

- **Entity:** `entities/address.entity.ts` — fields such as `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state`.
- **Repository:** `repositories/address.repository.ts` + `repositories/prisma/prisma.address.repository.ts`.
- **Service:** `services/addresses.service.ts` — `create`, `findById`.

## Module contract

- **Exports:** `AddressesService`
- **Imports:** none (uses shared `PrismaService`, `ClsService` internally)

## Data model (Prisma)

`Address` model (`@@map("address")`); `Establishment` holds `addressId`.

## Consumers

- **Sessions module** — `RegisterUserUseCase` creates an address when registering an establishment with full establishment fields.

## Related documentation

- [Establishments module](establishments.md)
- [Sessions module](sessions.md)
