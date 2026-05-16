# Establishments module

**Path:** `src/modules/establishments/`

## Purpose

Manages **business establishments**: document identity (CPF/CNPJ), **one or more establishment types** (catalog table `establishment_type` + join `establishment_establishment_type`), branding (logo path), link to an **address**, and **user–establishment** roles (owner, admin, staff).

## Architecture

- **Entity:** `entities/establishment.entity.ts`
- **Repositories:**
  - `establishment.repository.ts` — establishment CRUD and queries such as `findByUserId`
  - `user-establishment.repository.ts` — links users to establishments with `UserRole`
- **Service:** `services/establishments.service.ts` — `create`, `findByEstablishmentId`, `findByUserId`, `update`, `linkUser`

## Module contract

- **Exports:** `EstablishmentsService`
- **Imports:** none (shared Prisma only)

## Data model (Prisma)

`Establishment`, `EstablishmentType` (catalog), `EstablishmentEstablishmentType` (join), `UserEstablishment`, enums `DocumentType`, `UserRole` (see `prisma/schema.prisma`).

## Consumers

- **Sessions module** — registration flow creates establishment + link when payload is complete; `GET /auth/me` loads establishment for the current user via `findByUserId`.

## Related documentation

- [Addresses module](addresses.md), [Contacts module](contacts.md)
- [API consumer guide](../API_CONSUMER_GUIDE.md) — register payload and `me` response
