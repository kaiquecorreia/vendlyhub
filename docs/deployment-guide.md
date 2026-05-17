# Vendlyhub - Deployment Guide

**Date:** 2026-05-16

## Status

The repository ships **only the local development infrastructure** in `docker-compose.yml` (a PostgreSQL container). There is no Dockerfile for either app, no Kubernetes/Helm chart, no Terraform/Pulumi, and no CI/CD workflow checked in (`.github/workflows/` is absent at the time of scanning). This guide therefore covers what is already in the repo plus the operational expectations that are encoded in code so that a deploy can be designed accurately later.

## Local infrastructure (committed)

### `docker-compose.yml`

```yaml
services:
  vendlyhub-postgres:
    image: postgres:18.1
    container_name: vendlyhub_postgres
    restart: always
    environment:
      POSTGRES_USER: gandalf
      POSTGRES_PASSWORD: gandalf123
      POSTGRES_DB: vendlyhub
    ports:
      - "5439:5432"
    volumes:
      - vendlyhub_postgres_data:/var/lib/postgresql/
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U gandalf -d vendlyhub" ]
      interval: 10s
      timeout: 5s
      retries: 5
volumes:
  vendlyhub_postgres_data:
    driver: local
```

- Host port `5439` → container `5432`.
- Volume `vendlyhub_postgres_data` persists data between restarts.
- Healthcheck uses `pg_isready -U gandalf -d vendlyhub`.

Start:

```bash
docker compose up -d
```

Stop and remove the container (data persists in the named volume):

```bash
docker compose down
```

Wipe the database (drops the volume):

```bash
docker compose down -v
```

## Deployment expectations encoded in code

### Backend (`app-backend`)

- **Build:** `pnpm build:backend` runs `prisma generate` then `nest build`. Output goes to `app-backend/dist/`.
- **Start:** `pnpm --filter vendlyhub-backend start:prod` runs `node dist/src/main.js`.
- **Static files:** `app-backend/src/main.ts` mounts `express.static(UPLOADS_ROOT)` at `/uploads/...` **before** Nest. Any deployment that runs the backend in a stateless environment must replace the local filesystem with a shared store (object storage, NFS, etc.) or pin uploads to a single instance.
- **Listen port:** `process.env.PORT ?? 3000`.
- **CORS:** `process.env.FRONTEND_URL || 'http://localhost:3001'` is the only allowed origin. Update for production domains.
- **Swagger:** UI is permanently mounted at `/api`. If exposing publicly, ensure it is intended (consider gating in production).
- **Conditional Google OAuth:** `GoogleStrategy` is only registered when `GOOGLE_CLIENT_ID` is set; the `/auth/google*` routes therefore only exist in OAuth-configured environments.
- **Email:** `nodemailer` requires SMTP credentials; the password-reset flow will fail without them.

#### Required env vars

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Prisma connection string |
| `JWT_SECRET` | Signs access JWTs (1h expiry) |
| `FRONTEND_URL` | CORS origin + OAuth success/error redirects |
| `PORT` | (optional, default 3000) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` | (optional) Google OAuth |
| `SMTP_*` (per `nodemailer`) | Password-reset email transport |

#### Database migrations

- **In production:** `pnpm --filter vendlyhub-backend prisma:migrate:deploy` against the target `DATABASE_URL`. Run as a one-shot job before rolling new app instances.
- **Manual reset (non-production):** `app-backend/prisma/reset-initial-state.sql` exists for dev convenience.

### Web (`app-web`)

- **Build:** `pnpm build:web` runs `next build`. Output goes to `app-web/.next/` (turbo declares this and excludes `.next/cache/**`).
- **Start:** `next start` (or any Next.js host: Vercel, container, etc.).
- **Required env:** `NEXT_PUBLIC_API_URL` pointing at the backend. Because it is `NEXT_PUBLIC_*`, the value is inlined at build time — rebuild on URL changes.
- **Coupling to backend:** the SPA expects the backend to share the same scheme/host (or for the backend `FRONTEND_URL` to match the SPA origin) for cookies/CORS.

## Recommended target topology

A pragmatic production layout that matches the code:

- **Reverse proxy / TLS termination** (e.g. nginx, Cloudflare) routing:
  - `https://app.vendlyhub.example/*` → Next.js (`app-web`)
  - `https://api.vendlyhub.example/*` → NestJS (`app-backend`)
- **Web tier:** Next.js running `next start` in a Node container (or hosted on Vercel).
- **API tier:** Node container running `node dist/src/main.js` with the env above.
- **Database:** managed PostgreSQL (RDS, Cloud SQL, Neon, etc.) reachable from the API tier.
- **Object storage** behind `/uploads/...` (S3 / Cloud Storage), if the API tier is multi-instance/stateless. Replace the `express.static(UPLOADS_ROOT)` mount with a redirect/signed-URL strategy or keep the API tier single-instance for now.
- **Secrets** via the platform's secret manager (AWS Secrets Manager, GCP Secret Manager, Doppler, etc.). Do not commit `.env` files to production deployments.
- **CI:** see Recommendations below.

## Recommendations / gaps to close

1. **Add Dockerfiles** for both apps. Reference shape:

   ```Dockerfile
   # app-backend/Dockerfile
   FROM node:24-alpine AS base
   RUN corepack enable
   WORKDIR /app
   COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
   COPY app-backend ./app-backend
   RUN pnpm install --frozen-lockfile
   RUN pnpm --filter vendlyhub-backend build
   CMD ["node", "app-backend/dist/src/main.js"]
   ```

   Mirror the same pattern for `app-web` (using `next start`).

2. **Add a production `docker-compose.yml`** (or Helm chart) that pulls the API image, applies migrations, and runs Next.js — useful for review environments.
3. **Define CI** (e.g. GitHub Actions) running:
   - `pnpm install --frozen-lockfile`
   - `pnpm --filter vendlyhub-backend prisma:generate`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`

   Cache `node_modules` and Prisma client appropriately. Turbo can be cached via remote cache.
4. **Run migrations as a separate step** before rolling new API instances (`prisma:migrate:deploy`).
5. **Externalize uploads** for a multi-instance API tier (S3/GCS).
6. **Tighten `console.log` of auth tokens** in `app-web/src/app/contexts/AuthContext.tsx` before any environment that could observe browser logs.
7. **Update Swagger metadata** in `app-backend/src/main.ts` (the description currently says "API for managing investment portfolios", which is a leftover from a previous scope).
8. **Health endpoints:** the backend currently has no `/health` or `/readiness` endpoint. Add one when deploying behind a load balancer.

## What changes between dev and prod

| Concern | Dev | Prod |
|---|---|---|
| Database | `docker compose up -d` (PostgreSQL 18.1, port 5439) | Managed PostgreSQL (≥ 18 recommended to match dev image) |
| Uploads | Local `app-backend/uploads/` served at `/uploads` | Either single-instance API with persistent disk, or object storage with a different serving strategy |
| Tokens | `console.log` of access/refresh in `AuthContext.storeAuthData` | Must be removed |
| Swagger | Open at `/api` | Decide whether to expose; consider gating |
| Google OAuth | Disabled unless `GOOGLE_CLIENT_ID` set | Configure or keep disabled deliberately |
| CORS | `http://localhost:3001` | Production SPA origin |
| Logging | Console only | Structured logs / log shipper recommended |

---

_Generated using BMAD Method `document-project` workflow_
