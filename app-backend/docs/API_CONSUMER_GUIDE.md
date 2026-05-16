# Vendlyhub API — Consumer guide

This document explains how client applications (web, mobile, or other backends) should call **Vendlyhub API**, a NestJS REST service for authentication and user/establishment onboarding.

## Module documentation (for contributors)

Internal structure by feature module (users, sessions, addresses, contacts, establishments, products, …): [docs/modules/README.md](modules/README.md).

---

## Quick facts

| Item | Value |
|------|--------|
| **Default base URL (local)** | `http://localhost:3000` |
| **Port** | `PORT` env (default **3000**) |
| **API style** | REST, JSON bodies (except where noted) |
| **Interactive docs** | [Swagger UI](https://swagger.io/tools/swagger-ui/) at **`/api`** |
| **Database** | PostgreSQL (server-side only; clients use HTTP only) |

---

## 1. OpenAPI / Swagger

The server generates an OpenAPI document and serves **Swagger UI** at:

`{baseUrl}/api`

Use it to inspect request/response shapes and to try requests. The app registers **Bearer JWT** security in Swagger (`Authorization: Bearer <access_token>`).

---

## 2. CORS and browser clients

CORS is enabled with:

- **Allowed origin**: `FRONTEND_URL` (default `http://localhost:3001`)
- **Credentials**: `true` (cookies/credentials mode allowed for that origin)
- **Methods**: `GET`, `HEAD`, `PUT`, `PATCH`, `POST`, `DELETE`, `OPTIONS`

For a browser SPA on another origin, set `FRONTEND_URL` on the server to that origin (including scheme and port).

---

## 3. Authentication model

### Access token (JWT)

- **Header**: `Authorization: Bearer <access_token>`
- **Payload** (conceptually): `sub` = user id, `email` = user email
- Used for protected routes (e.g. `GET /auth/me`, `POST /auth/logout`)

### Refresh token

- **Opaque string** (UUID), not a JWT
- Returned on login/register flows that issue tokens
- Send in **JSON body** as `refresh_token` where documented
- Stored server-side (hashed); used to obtain a **new access token** without re-entering password
- **Lifetime**: new refresh sessions are created with **7 days** expiry (see token creation in the codebase)

### Typical client flow

1. **Register** or **Login** → receive `access_token` + `refresh_token`
2. Call protected endpoints with `Authorization: Bearer <access_token>`
3. When the access token expires, call **`POST /auth/refresh`** with `refresh_token`
4. On sign-out, call **`POST /auth/logout`** with both Bearer access token and `refresh_token` in the body

---

## 4. Environment variables (for operators)

These affect behavior for API consumers:

| Variable | Role |
|----------|------|
| `FRONTEND_URL` | CORS origin; OAuth success/error redirects |
| `PORT` | HTTP listen port (default 3000) |
| `JWT_SECRET` | Signs access tokens (must be set in production) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | If `GOOGLE_CLIENT_ID` is set, Google OAuth routes are enabled |

`DATABASE_URL` is server-only (Prisma).

---

## 5. Endpoints

Unless noted, send **`Content-Type: application/json`**.

### 5.1 `POST /auth/register`

Creates a user and optionally an **establishment** (business) with address and contacts when all required establishment fields are present.

**Content types**

- **`application/json`** — suitable when you are not uploading a logo file.
- **`multipart/form-data`** — use when uploading a **logo** image (field name: **`logo`**).

**Logo upload rules (multipart)**

- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
- Max size: **2 MB**
- Stored under `/uploads/logos/`; the API stores a path like `/uploads/logos/<filename>` on the establishment when creation runs.

**Body fields (JSON or form fields)**

| Field | Required | Notes |
|-------|----------|--------|
| `email` | Yes | Valid email |
| `password` | No | Min length **8** if provided |
| `name` | No | User display name |
| `establishmentName` | For establishment | |
| `documentType` | For establishment | `cpf` or `cnpj` |
| `document` | For establishment | Unique per establishment rules |
| `establishmentTypes` | For establishment | Repeat field or array: one or more labels from the seeded catalog (e.g. `Restaurantes`, `Pizzarias`; see `establishment_type` table) |
| `cep`, `street`, `number`, `complement`, `neighborhood`, `city`, `state` | No | Address pieces |
| `phone_number`, `mobile_number` | No | Contacts for the establishment when it is created |

**Establishment creation** happens only when **all** of the following are present: `establishmentName`, `documentType`, `document`, `establishmentTypes` (at least one value).

**Responses**

- If **`password`** was provided: same shape as login — **`{ "access_token": "...", "refresh_token": "..." }`**
- If **`password`** was not provided: **`{ "message": "User registered successfully" }`** (no tokens)

**Errors**

- **`409 Conflict`** — email already registered (message may be in Portuguese: e.g. “Email já cadastrado”)
- Validation errors for invalid email, password length, enums, etc.

---

### 5.2 `POST /auth/login`

**Body**

```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response** `200`

```json
{
  "access_token": "<jwt>",
  "refresh_token": "<uuid>"
}
```

**Errors**

- **`401 Unauthorized`** — invalid credentials

---

### 5.3 `POST /auth/refresh`

**Body**

```json
{
  "refresh_token": "<uuid from login/register>"
}
```

**Response** `200`

```json
{
  "access_token": "<new jwt>"
}
```

The refresh token itself is not rotated in this response (only a new access token is returned).

**Errors**

- **`401`** — missing `refresh_token`, invalid, expired, or revoked

---

### 5.4 `POST /auth/logout`

**Headers**

- `Authorization: Bearer <access_token>`

**Body**

```json
{
  "refresh_token": "<uuid>"
}
```

**Response** `200`

```json
{
  "message": "Logged out successfully"
}
```

**Errors**

- **`401`** — missing/invalid access token or missing `refresh_token`

---

### 5.5 `GET /auth/me`

**Headers**

- `Authorization: Bearer <access_token>`

**Response** `200` — current user plus optional establishment (if linked)

Shape (conceptual):

```json
{
  "userId": "<uuid>",
  "name": "Display Name",
  "email": "user@example.com",
  "establishment": {
    "establishmentId": "...",
    "name": "...",
    "document": "...",
    "documentType": "cpf",
    "establishmentTypes": ["Restaurantes", "Pizzarias"],
    "logo": "/uploads/logos/....",
    "addressId": "...",
    "isActive": true,
    "deletedAt": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

If the user has no establishment, `establishment` may be omitted.

**Errors**

- **`401`** — invalid/missing token or user not found

---

### 5.6 Google OAuth (optional)

These routes exist only when **`GOOGLE_CLIENT_ID`** is configured on the server.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/auth/google` | Starts OAuth; browser redirect |
| `GET` | `/auth/google/callback` | Passport callback; redirects browser to the SPA |

**Success redirect**

`{FRONTEND_URL}/auth/callback?access_token=...&refresh_token=...`

**Failure redirect**

`{FRONTEND_URL}/login?error=auth_failed`

SPA clients should parse query parameters on the callback route and store tokens like a normal login.

---

### 5.7 Products (authenticated)

All routes require **`Authorization: Bearer <access_token>`** and assume the user is linked to an establishment.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/products` | List products (query: pagination, `categoryId`, `status`, `search`, sort) |
| `GET` | `/products/:id` | Get one product |
| `POST` | `/products` | Create product |
| `PATCH` | `/products/:id` | Update product |
| `DELETE` | `/products/:id` | Soft-delete product |

**Create / update content type:** use **`multipart/form-data`** when uploading an image; otherwise you can still use multipart with only text fields. Optional file field: **`image`** (JPEG, PNG, WebP; max **5 MB**). Other fields are sent as form fields (or JSON is not used by these handlers—use form fields for compatibility).

**Minimum create body (form fields)**

| Field | Required |
|-------|----------|
| `name` | Yes |
| `salePrice` | Yes (number ≥ 0) |

All other product fields are optional. If **`categoryId`** is omitted, the API assigns the default category **`Geral`** (created per establishment if it does not exist). If **`sku`** is omitted or empty, a unique SKU is generated server-side.

**Example (`curl`, minimal create)**

```bash
ACCESS_TOKEN="<paste access_token>"

curl -s -X POST "http://localhost:3000/products" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "name=Meu produto" \
  -F "salePrice=9.99"
```

See [docs/modules/products.md](modules/products.md) for defaults and [Swagger at `/api`](#1-openapi--swagger) for the full schema.

---

## 6. Static files

Uploaded logos are exposed as static files under:

`{baseUrl}/uploads/...`

Example: `GET http://localhost:3000/uploads/logos/<file>` returns the image (subject to deployment and reverse-proxy rules).

---

## 7. HTTP status codes (common)

| Code | Meaning |
|------|--------|
| `200` | Success |
| `201` | May appear for some Nest conventions; this API mostly uses `200` for auth actions |
| `400` | Bad request / validation |
| `401` | Unauthorized (auth required or invalid credentials/tokens) |
| `409` | Conflict (e.g. duplicate email on register) |

---

## 8. Example: `curl`

**Login**

```bash
curl -s -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"yourpassword"}'
```

**Authenticated request**

```bash
ACCESS_TOKEN="<paste access_token>"

curl -s "http://localhost:3000/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

**Refresh**

```bash
curl -s -X POST "http://localhost:3000/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"<paste refresh_token>"}'
```

---

## 9. Example: JavaScript (`fetch`)

```javascript
const baseUrl = 'http://localhost:3000';

async function login(email, password) {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { access_token, refresh_token }
}

async function getMe(accessToken) {
  const res = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function refresh(refreshToken) {
  const res = await fetch(`${baseUrl}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { access_token }
}
```

---

## 10. Other REST surface

Besides authentication (`/auth/...`), the app exposes additional **JWT-protected** routes (e.g. **products**, **categories**, **orders**) and **public** catalog routes for storefronts. There is **no** generic `GET /users/:id`; for the current user profile use **`GET /auth/me`**. Prefer **Swagger at `/api`** and the module docs under [docs/modules/](modules/README.md) for the full, up-to-date contract.

---

## 11. Related files in this repo

- Runtime entry and Swagger/CORS: `src/main.ts`
- Auth routes: `src/modules/sessions/controllers/auth.controller.ts`
- Example HTTP snippets (partially outdated vs current routes): `src/modules/users/request.http`

When in doubt, prefer **`/api` (Swagger)** and the controller source over older examples.
