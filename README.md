# Vendlyhub Monorepo

Monorepo with Turborepo + pnpm workspaces containing:

- `app-web` (Next.js)
- `app-backend` (NestJS)

## Requirements

- Node.js `24.13.0` (`.nvmrc` at repository root)
- pnpm `10.27.0`

## Install

```bash
pnpm install
```

## Run in development

Run all apps:

```bash
pnpm dev
```

Run only one app:

```bash
pnpm dev:web
pnpm dev:backend
```

## Build, lint, and test

```bash
pnpm build
pnpm lint
pnpm test
```

## Backend database

PostgreSQL for backend local development:

```bash
docker compose up -d
```
