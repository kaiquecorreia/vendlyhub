# Products module

**Path:** `src/modules/products/`

## Purpose

Manages **products** for the authenticated user’s **establishment**: CRUD, optional image upload, and listing with filters. Products are always tied to a **category** in the database; when the client does not send `categoryId` on create, the API assigns the default category name **`Geral`** (created once per establishment if missing).

## Architecture

- **Controller:** `products.controller.ts` — JWT-protected routes under `/products`; `POST` and `PATCH` accept **`multipart/form-data`** (product fields + optional file field **`image`**).
- **Service:** `products.service.ts` — `listForUser`, `getByIdForUser`, `createForUser`, `updateForUser`, `deleteForUser` (soft delete).
- **DTOs:** `dto/create-product.dto.ts`, `dto/update-product.dto.ts`, `dto/list-products-query.dto.ts`.

## Create payload (contract)

| Field | Required | Notes |
|-------|----------|--------|
| `name` | **Yes** | Non-empty string, max 160 chars |
| `salePrice` | **Yes** | Number ≥ 0 (JSON key `salePrice`; maps to DB `sale_price`) |
| `categoryId` | No | If omitted, product is placed in category **`Geral`** (get-or-create per establishment) |
| `sku` | No | If omitted or blank, server generates a unique SKU (e.g. `AUTO-` + random hex) |
| `brand`, `model`, `description`, `unit`, `supplier` | No | Default to empty string when omitted |
| `discount`, `cost`, `stockQuantity`, `reservedStock`, `soldQuantity`, `minStock` | No | Default to **0** when omitted |
| `supplierCode`, `ean` | No | Optional strings |
| `status` | No | Defaults to **`active`** when omitted |
| `image` | No | Multipart file field (not part of JSON DTO): `image/jpeg`, `image/png`, `image/webp`, max **5 MB** |

**Validation:** `discount` cannot exceed `salePrice` (after applying defaults).

## Module contract

- **Exports:** `ProductsModule` (registers `ProductsController` and `ProductsService`).
- **Imports:** shared Prisma, sessions (JWT guard usage via controller).

## Data model (Prisma)

`Product` — see `prisma/schema.prisma`. Unique constraint `(establishmentId, sku)`.

## Consumers

- **Catalog module** — public storefront reads products by establishment (no JWT).
- **Categories module** — products reference `category_id`; default category **`Geral`** is created by the products service when needed.

## Related documentation

- [API consumer guide](../API_CONSUMER_GUIDE.md) — `/products` authenticated routes
- OpenAPI: **`/api`** (Swagger), tag **`products`**
