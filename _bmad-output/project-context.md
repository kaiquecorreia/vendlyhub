---
project_name: 'vendlyhub'
user_name: 'Vendlyhub'
date: '2026-05-17'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 165
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Tooling (root)
- **Node.js** 24.13.0 (root `.nvmrc` is the single source of truth; `app-web` declares `engines.node >=22.14.0`, backend has none)
- **pnpm** 10.27.0 (declared as root `packageManager` — use pnpm filters, not npm/yarn)
- **Turborepo** 2.5.3 (`pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test` orchestrate both workspaces)
- **Husky** 9.1.7 (git hooks installed via `pnpm prepare`)
- **Docker** required for local PostgreSQL on host port **5439**

### Web — `app-web/` (TypeScript 5, ESM)
- **Next.js** 15.2.8 (App Router; dev uses **Turbopack**)
- **React** 19.0.0 / **react-dom** 19.0.0
- **axios** 1.9.0 (centralized `apiClient` only)
- **react-hook-form** 7.57.0 + **zod** 3.25.56 + **@hookform/resolvers** 5.0.1
- **sass** 1.86.3 (CSS Modules: `*.module.scss`) + **next-themes** 0.4.6
- **lucide-react** 0.487.0, **react-icons** 5.5.0, **recharts** 2.15.2, **sonner** 2.0.7
- **firebase** 11.9.0, **canvas-confetti** 1.9.3, **qrcode.react** 4.2.0, **date-fns** 4.1.0
- **ESLint** 9 + **eslint-config-next** 15.2.4 + **Prettier** 3.5.3

### Backend — `app-backend/` (TypeScript 5.7, CommonJS — `"type": "commonjs"`)
- **NestJS** 11.0.x (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `@nestjs/swagger` 11.2)
- **Express** 5.2.1 (raw Express server is required to mount `/uploads` before Nest)
- **Prisma** 7.3 (`@prisma/client` + `@prisma/adapter-pg`)
- **PostgreSQL** 18.1 (Docker `postgres:18.1`, host port 5439, db `vendlyhub`)
- Auth: `@nestjs/jwt` 11, `@nestjs/passport` 11, `passport-jwt` 4, `passport-local` 1, `passport-google-oauth20` 2, **bcrypt** 6
- Validation: **class-validator** 0.14, **class-transformer** 0.5 (global `ValidationPipe`)
- Uploads: **multer** 2.1, Email: **nodemailer** 8.0, IDs: **uuid** 13
- Tests: **jest** 29, **ts-jest** 29, **supertest** 7

### Version Constraints (don't break these)
- Do NOT downgrade Node below the `.nvmrc` pin (24.13.0). Several deps (Next 15, Prisma 7) require modern Node.
- Do NOT introduce a different package manager — `pnpm-workspace.yaml` + `pnpm-lock.yaml` are authoritative.
- Backend is **CommonJS**, web is **ESM** (Next default) — keep imports compatible per workspace.
- Prisma is locked to v7.x; bumping affects both `@prisma/client` and `@prisma/adapter-pg` together.
- React 19 + Next 15 paired — bump them together.

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

**Both workspaces**
- `strict: true` is enabled everywhere — no implicit `any`, all nulls handled. Don't disable per-file with `// @ts-ignore`; use `// @ts-expect-error <reason>` only when truly unavoidable.
- `forceConsistentCasingInFileNames: true` (backend) — file imports must match disk casing exactly. Web inherits Next defaults; same rule applies in practice.
- Never use `require(...)` in either workspace; use ESM `import` syntax (the backend transpiles to CJS but source is written ESM-style).

**Web (`app-web/`) — ESNext + `moduleResolution: bundler`**
- Path alias: `@/*` → `./src/*`. Prefer `@/app/...` over deep relative imports (`../../../`).
- `target: ES2017` + `lib: dom, dom.iterable, esnext`. Don't ship code that requires `DOM` APIs in places that may run on the server (App Router server components).
- `isolatedModules: true` — every file must be independently transpilable. Use `import type { Foo }` for type-only imports to avoid runtime cycles.
- Use the `'use client'` directive only when a component needs hooks, browser APIs, or event handlers — keep server components the default.

**Backend (`app-backend/`) — CommonJS + ES2021**
- `experimentalDecorators` + `emitDecoratorMetadata` are required — every controller, provider, DTO, and entity must use the appropriate NestJS / class-validator decorators or DI will silently fail.
- `strictNullChecks: true` is explicit — repository methods returning `... | null` must be narrowed before use; throw `NotFoundException` rather than returning `null` from services where the caller expects an entity.
- Async functions: prefer `async/await`. Don't mix `.then()` with `await` in the same chain. Top-level `bootstrap()` uses `.then().catch(...)` deliberately because it can't be `await`-ed at module scope.
- `removeComments: true` strips comments at build time — keep JSDoc/doc comments in source, but don't rely on them at runtime (e.g. for Swagger metadata — use `@ApiProperty` decorators).
- IDs: import `uuid` as `import { v4 as uuidv4 } from 'uuid'` (mocked stable in tests via `src/__mocks__/uuid.ts` — DO NOT bypass it for new token tests).

**Error handling (cross-app)**
- Backend: throw `BadRequestException`, `NotFoundException`, `UnauthorizedException`, `ConflictException`, `ForbiddenException` from `@nestjs/common`. Don't `throw new Error(...)` from controllers/services — Nest's exception filter formats `HttpException`s correctly for the OpenAPI surface.
- Web: never `throw` to the user. Catch in the component, call `normalizeApiError(err, fallbackMessage)` (from `apiClient.ts`), and surface via a `sonner` toast.
- Never `console.log` request bodies, tokens, passwords, or user emails in production code paths (known smell exists in `AuthContext.storeAuthData` — do NOT replicate it).

### Framework-Specific Rules — Backend (NestJS 11)

**Module composition**
- Every feature lives under `app-backend/src/modules/<name>/` with at minimum: `<name>.module.ts`, a controller (if exposing HTTP), a service, and `dto/`. New modules must be added to `src/app.module.ts` `imports`.
- Two existing module patterns — keep contributions consistent with the module's existing style:
  - **Rich pattern** (`sessions`, `users`, `establishments`, `addresses`, `contacts`): `use-cases/<verb-thing>.usecase.ts` orchestrate logic; `repositories/<thing>.repository.ts` declares an interface + **string DI token**; `repositories/prisma/prisma.<thing>.repository.ts` implements it; bound in module as `{ provide: <TOKEN>, useClass: PrismaXxxRepository }`.
  - **Thin pattern** (`categories`, `products`, `catalog`, `orders`): service injects `PrismaService` directly; no repository abstraction.
- Controllers must stay thin: `req + DTO → use-case/service → response`. Never call `PrismaService` from a controller.
- Conditional providers (e.g. `GoogleStrategy`): use the spread pattern `...(process.env.X ? [Foo] : [])` so the app boots without the env var.

**Authentication**
- Protect authenticated routes with `@UseGuards(JwtAuthGuard)` at the controller class level (preferred) or per handler.
- `JwtStrategy.validate` populates `req.user.userId` — type request params as `@Request() req: { user: { userId: string } }`.
- Login-only routes use `@UseGuards(LocalAuthGuard)`. Don't create new auth guards; extend the existing strategies.
- Never persist plaintext credentials/tokens. Use `bcrypt.hash(value, 10)` and `bcrypt.compare(...)` (see `LoginUserUseCase`). Refresh tokens stored as bcrypt hash of the UUID in `auth_token`; do NOT change the hashing approach without rotating the column.

**Validation**
- All HTTP bodies/queries must be DTO classes under `<module>/dto/` with `class-validator` decorators.
- Global `ValidationPipe({ whitelist: true, transform: true })` strips unknown fields and coerces types — do NOT disable it. For multipart routes, decorate numeric/boolean fields with `@Type(() => Number)` / `@Transform(...)` so form strings coerce correctly.
- For Swagger surface: pair each DTO field with `@ApiProperty(...)` (or `@ApiPropertyOptional`); pair each controller with `@ApiTags(...)` and `@ApiBearerAuth()` when guarded.

**File uploads**
- Define new upload destinations in `src/upload-paths.ts` AND add a matching `mkdirSync(<dir>, { recursive: true })` in `main.ts` `bootstrap()`.
- Use `FileInterceptor('<field>', { storage: diskStorage(...), fileFilter, limits })`. Existing limits: **2 MB** for logos/avatars, **5 MB** for product images. Existing MIME filter: `^image\/(jpeg|png|webp)$`.
- Persist a URL path (e.g. `/uploads/products/<file>`) on the entity column — never the absolute filesystem path.
- Add `@ApiConsumes('multipart/form-data')` to multipart handlers so Swagger renders the upload form.
- **NEVER move the `/uploads` static middleware into a Nest module** — it must remain on the raw Express server in `main.ts` before `NestFactory.create(...)`. Nest's 404 handler will otherwise shadow file requests.

**Transactions**
- For multi-step writes that must be atomic (e.g. user + establishment + address + contacts in `RegisterUserUseCase`), inject `TransactionService` from `shared/prisma/`. Don't call `prisma.$transaction(...)` directly outside of `TransactionService`.
- Only `app-backend/src/shared/prisma/` imports `@prisma/client`. Feature modules consume Prisma via `PrismaService.getClient()` or through their repository abstraction.

### Framework-Specific Rules — Web (Next.js 15 + React 19)

**Routing & navigation**
- `app-web/src/app/config/navigation.ts` is the **single source of truth** for routes (`ERoutePath` enum, `ROUTES`, `PUBLIC_ROUTE_PREFIXES`, `mainNavigation`). When you add a `page.tsx`:
  1. Add the path to `ERoutePath`.
  2. Add it to `ROUTES[ERouteType.PUBLIC]` or `ROUTES[ERouteType.PRIVATE]` (or to `PUBLIC_ROUTE_PREFIXES` for dynamic public groups like `/catalog/`).
  3. If it should appear in the sidebar, add a `NavigationItem` to `mainNavigation`.
- If you forget step 2, `middleware.ts` will treat the path as invalid — unauthenticated users redirect to `/login`; authenticated users rewrite to `/_not-found`.
- `PUBLIC_ROUTE_PREFIXES` currently holds `['/catalog/']` — extend it (not `ROUTES.PUBLIC`) when adding new dynamic public segments.

**API access**
- ALL backend calls go through `app-web/src/app/services/apiClient.ts` (Axios instance). Do NOT use raw `axios`, `fetch`, or alternate HTTP clients.
- New domain services live at `app-web/src/app/services/<domain>Service.ts` and consume `apiClient`.
- The request interceptor injects `Authorization: Bearer ${localStorage.accessToken}` (client-only, guarded by `typeof window !== 'undefined'`).
- The response interceptor calls `forceClientLogout(...)` on **401** for requests that had Auth headers, and on **404** when the response body message contains `"user not found"` — both clear `localStorage` + cookie and redirect to `/login?redirect=<path>`.
- Convert backend errors to UI messages with `normalizeApiError(err, fallback)`; render via `sonner` toast (`toast.error(...)`).
- For image URLs from `/uploads/...`, always go through `app-web/src/app/services/mediaUrl.ts` — never hardcode `NEXT_PUBLIC_API_URL + path` in components.

**Forms**
- Each form page (`login/`, `register/`, `fast-onboarding/`, etc.) co-locates a `schema.ts` (zod) + `styles.module.scss`. Wire `useForm` with `@hookform/resolvers/zod`.
- Multipart uploads build a `FormData` and submit through the matching domain service — never call `apiClient` directly from a form component.

**Auth lifecycle**
- `AuthContext` is the only place that touches `localStorage` for auth keys (`accessToken`, `refreshToken`, `user`) AND mirrors the access token into the `auth-token` cookie.
- The cookie is what `middleware.ts` reads on the edge; `localStorage` is what `apiClient` reads in the browser. They MUST stay in sync — always update both via `storeAuthData` / `clearAuthSessionStorage`.
- A forced logout dispatches `AUTH_INVALID_SESSION_EVENT` (custom window event). New components that mirror auth state should listen to this event to reset.

**Theming & layout**
- Theme toggling is done via `next-themes` (`<ThemeProvider attribute="class" enableSystem defaultTheme="system">` in `RootLayout`). Use the `useToggleTheme()` hook — don't call `setTheme` directly from components scattered around the tree.
- SCSS Modules (`*.module.scss`) live next to the consuming `page.tsx`/component. Don't introduce global CSS outside `styles/globals.scss`.

**React 19 / App Router**
- Default to server components. Only add `'use client'` to files that need hooks, browser APIs, event handlers, or Context.
- Don't put `apiClient` calls in server components — it depends on `localStorage`. Either fetch through a client component, or in the future, build a separate server-safe fetch helper (not currently in the codebase).

### Testing Rules

**Backend (`app-backend/`) — Jest 29**
- Jest config is inline in `app-backend/package.json` (`rootDir: "src"`, `testRegex: ".*\\.spec\\.ts$"`). New unit/integration tests must end with `.spec.ts` and live next to the file they cover (e.g. `products.controller.ts` → `products.controller.integration.spec.ts`).
- File-naming convention:
  - `<file>.spec.ts` — unit tests (services, use-cases, utils) with mocked dependencies.
  - `<file>.integration.spec.ts` — controller-level tests that drive the Nest module via `Test.createTestingModule(...).compile()` + `supertest`.
- E2E tests live under `app-backend/test/` and run with `pnpm test:e2e` (config in `test/jest-e2e.json`). Don't mix e2e files into `src/`.
- **Unit test pattern**: instantiate the class directly with hand-rolled fake collaborators typed as `{ method: jest.Mock }` (see `login-user.usecase.spec.ts`). Do NOT spin up a full Nest module for unit tests — it makes them slow and obscures intent.
- **Mock `bcrypt`** when testing auth flows: `jest.mock('bcrypt')` at module top + `(bcrypt.compare as jest.Mock).mockResolvedValue(true)`.
- **UUIDs are mocked** to stable values via `src/__mocks__/uuid.ts` (`moduleNameMapper` in Jest config) — token-related tests should rely on `'mock-uuid-v4'` rather than generating fresh UUIDs.
- `prebuild`, `prelint`, `pretest` all run `prisma:generate` — never commit code that breaks `prisma generate` (e.g. invalid schema), or all those pipelines fail.
- Test descriptions are written in **Portuguese** (matching the team's convention; e.g. `'lança UnauthorizedException quando senha inválida'`) — keep new tests consistent in language with their neighbors.
- Coverage output goes to `app-backend/coverage/` (declared as a Turbo `test` task output). Run `pnpm --filter vendlyhub-backend test:cov` to refresh it.

**Integration test pattern (backend controllers)**
- Build the testing module with `Test.createTestingModule({ controllers: [...], providers: [...] }).compile()`. Override `PrismaService` (and any external collaborator) with a mock — do not hit the real DB.
- Drive the HTTP layer with `request(app.getHttpServer())` from `supertest`. Apply the same global pipes used in production (`app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`) so validation behavior matches.
- For guarded routes, override `JwtAuthGuard` with a stub `{ canActivate: () => true }` and inject a fake `req.user`.

**Web (`app-web/`)**
- There is currently **no automated frontend test suite**. Don't assume one exists when writing or extending code.
- If you introduce tests, follow the recommendation in the dev guide: **Vitest or Jest + React Testing Library** for components and **Playwright** for the public storefront / auth / onboarding flows. Co-locate with the source as `*.test.tsx` (or `*.spec.tsx`).
- Linting + TypeScript compile are the de-facto gates today — `pnpm lint:web` and `pnpm build:web` must both pass before committing changes that touch the web app.

**General**
- Never write tests that depend on real network, real Postgres (outside of `test:e2e`), or real `localStorage` state shared across files. Each test sets up and tears down its own fixtures.
- When adding flaky-prone async tests, prefer `await expect(promise).rejects.toThrow(...)` over `try/catch` with manual assertion counters.

### Code Quality & Style Rules

**Formatting (Prettier)**
- **Web (`app-web/.prettierrc`)**: `singleQuote: true`, `trailingComma: "all"`, `semi: true`, `printWidth: 100`, `tabWidth: 2`, `arrowParens: "always"`, `endOfLine: "lf"`.
- **Backend (`app-backend/.prettierrc`)**: `singleQuote: true`, `trailingComma: "all"` (rest are Prettier defaults — 80-col print width).
- Don't introduce a third Prettier config. If a rule needs changing, change it in the workspace `.prettierrc` and run `pnpm format` from the affected workspace.
- Line endings are LF (web is explicit; backend should follow). Don't commit CRLF.

**Linting (ESLint 9)**
- Both workspaces use Prettier-integrated ESLint flat configs. `eslint-plugin-prettier` is enabled — Prettier violations show up as lint errors. Run `pnpm lint:web` / `pnpm lint:backend` (or `:fix` variants) before pushing.
- **Web** extends `next/core-web-vitals`, `next/typescript`, `plugin:prettier/recommended`. Keep `eslint-config-next` lint rules — they catch App Router pitfalls (e.g. invalid `<Image>` usage, hooks rules).
- **Backend** uses `typescript-eslint` with **recommendedTypeChecked** rules (project-aware). Three rules are intentionally relaxed:
  - `@typescript-eslint/no-explicit-any: 'off'` — `any` is allowed when escaping a generic DTO, but prefer real types.
  - `@typescript-eslint/no-floating-promises: 'warn'` — fix warnings; an unhandled promise in a request handler can crash on rejection.
  - `@typescript-eslint/no-unsafe-argument: 'warn'` — same; fix when you have type info available.
- For `*.spec.ts` / `*.test.ts`, backend disables `no-unsafe-argument`, `no-unsafe-assignment`, and `unbound-method` — that's intentional for ergonomic mocking. Don't extend these relaxations to source files.

**Naming conventions**
- **Files & folders (TS/JS)**: `kebab-case.ts` (backend modules, use-cases, repositories), `camelCase.ts` (web hooks/services like `useCart.ts`, `apiClient.ts`, `categoryService.ts`), `PascalCase.tsx` (React components and pages folder names follow Next App Router conventions — directories are lowercased route segments).
- **Use-cases (backend)**: `<verb-thing>.usecase.ts` exporting a class `<VerbThing>UseCase` with a single `async execute(...)` method.
- **Repositories (backend)**: interface lives in `<thing>.repository.ts` with a `<THING>_REPOSITORY` string DI token; the Prisma implementation lives in `repositories/prisma/prisma.<thing>.repository.ts` as `Prisma<Thing>Repository`.
- **DTOs (backend)**: `<verb>-<thing>.dto.ts` exporting a class like `CreateProductDto`. Query DTOs use the suffix `-query.dto.ts` (e.g. `list-products-query.dto.ts`).
- **Services**: backend `<name>.service.ts` exports `<Name>Service`; web `<name>Service.ts` (camelCase) exports a singleton object/instance.
- **React components**: `PascalCase` directory containing `index.tsx` (or `<Name>.tsx`) + `styles.module.scss`. Hooks: `useXxx.ts` camelCase, in `app/hooks/`.
- **Zod schemas**: per-page `schema.ts` (camelCase exports) co-located with the form's `page.tsx`.
- **Enums**: prefix with `E` (e.g. `ERoutePath`, `ERouteType`) when they describe a type/role, matching the existing convention in `navigation.ts`.

**Code organization**
- **Backend**: `app-backend/src/modules/<name>/` contains the module. Shared infrastructure (Prisma, transactions, CLS, constants, utils) lives under `app-backend/src/shared/`. Never put feature code in `shared/`.
- **Web**: everything under `app-web/src/app/`. Subfolders: `components/` (UI), `services/` (HTTP), `hooks/`, `lib/` (pure helpers), `contexts/`, `config/`, `styles/`, `types/`, `utils/`. Don't introduce a sibling folder structure outside `src/app/`.
- Co-locate page-specific assets (schema, styles, internal components) inside the page folder rather than the shared `components/` directory.

**Documentation**
- Add JSDoc block comments for **non-obvious** invariants and public APIs (see `navigation.ts` for the canonical example). Don't add redundant comments narrating obvious code.
- Backend DTOs and controllers should carry Swagger decorators (`@ApiProperty`, `@ApiTags`, `@ApiBearerAuth`) — these are the runtime "docs" since `removeComments: true` strips source comments at build.
- Long-form module docs live under `app-backend/docs/modules/` (existing modules have `.md` companions). Update them when public API changes.

**Imports**
- Group order: third-party first, then Nest/Next packages, then internal modules. Within internal, prefer alias paths (`@/...` on web) over deep relative paths.
- Don't import from `dist/`, build artifacts, or barrel files that re-export the world — each module exports the small surface it owns.

### Development Workflow Rules

**Pre-commit hook**
- Husky 9.1.7 is installed via the root `prepare` script. The repo's `.husky/pre-commit` runs `pnpm lint` (which fans out via Turbo to both workspaces). A failing lint blocks the commit — fix lints before committing; do NOT bypass with `--no-verify`.

**Branching & commits**
- The default branch is `main` and tracks `origin/main`. There is no `develop`/`staging` branch convention in the repo.
- Existing commit history uses **Conventional Commits** prefixes (`feat:`, `chore:`, ...). Match the style:
  - `feat(scope): ...` for user-visible features
  - `fix(scope): ...` for bug fixes
  - `chore(scope): ...` for maintenance, build, docs
  - `refactor(scope): ...` for non-behavioral code changes
  - `test(scope): ...` for tests-only changes
  - Scope is optional but useful when touching only one workspace (`feat(web): ...`, `fix(backend): ...`).
- Write commit subjects in English (matches `feat: monorepo` / `chore: bmap documentation`). Keep them ≤72 chars.

**Workspace commands (always run from repo root unless noted)**

| Command | Effect |
|---|---|
| `pnpm install` | Installs both workspaces from `pnpm-lock.yaml` |
| `pnpm dev` | `turbo run dev start:dev` — boots both apps in watch mode |
| `pnpm dev:web` / `pnpm dev:backend` | Single-workspace dev |
| `pnpm build` | `turbo run build` (web `next build`, backend `prisma generate` + `nest build`) |
| `pnpm lint` | `turbo run lint` (runs both) |
| `pnpm test` | `turbo run test` (currently the backend Jest suite — web has no tests) |
| `pnpm --filter <workspace> <script>` | Direct workspace passthrough (e.g. `pnpm --filter vendlyhub-backend prisma:migrate:dev`) |
| `docker compose up -d` / `down` / `down -v` | Local Postgres (port 5439). `-v` wipes the DB volume. |

**Turbo pipeline contract** (from `turbo.json` — don't break these)
- `build` depends on upstream `^build`; declared outputs: `dist/**`, `.next/**` (minus `.next/cache/**`). Keep new build artifacts in those paths so Turbo cache works.
- `test` declared output: `coverage/**` — don't redirect Jest coverage elsewhere.
- `dev` and `start:dev` are `cache: false` and `persistent: true` — they hang the terminal; don't add caching to them.

**Prisma migrations**
- Schema: `app-backend/prisma/schema.prisma`. Migrations: append-only under `app-backend/prisma/migrations/<timestamp>_<name>/`.
- Create a migration with: `pnpm --filter vendlyhub-backend prisma:migrate:dev --name <change_name>`.
- Never hand-edit a migration that has been merged to `main` — create a new one to alter previous state.
- After pulling a branch that touches `schema.prisma` or `prisma/migrations/`, run `pnpm --filter vendlyhub-backend prisma:migrate:dev` (or at minimum `prisma:generate`) before starting the backend.
- A manual reset SQL exists at `app-backend/prisma/reset-initial-state.sql` — use only for local resets, not in production paths.

**Environment & secrets**
- Local `.env` files exist in both workspaces (`app-backend/.env`, `app-web/.env.local`) and ARE committed with dev defaults. Do NOT commit production secrets to these files; production deploys must inject env vars out-of-band.
- Backend required envs: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`. Optional: `PORT`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, SMTP vars for `nodemailer`.
- Web required env: `NEXT_PUBLIC_API_URL` (inlined at build time — rebuild when it changes; runtime override is not supported).

**CI / Deployment**
- There is NO CI workflow or production deployment configuration committed (`.github/workflows/` is absent; no Dockerfile for either app). When adding CI, the minimum gate is `pnpm install && pnpm lint && pnpm test && pnpm build`.
- Production runtime expectations from code: Node ≥ 22 (root pin 24.13.0), PostgreSQL ≥ 18, writeable filesystem at `app-backend/uploads/` OR replace `express.static(UPLOADS_ROOT)` with object storage if running stateless.
- See `docs/deployment-guide.md` for the full operational checklist (CORS origins, Swagger gating, OAuth callback URLs, etc.) when designing a deploy.

### Critical Don't-Miss Rules

**Hard-fail anti-patterns (do NOT do)**

- **DON'T** move `express.static('/uploads', UPLOADS_ROOT)` into a Nest module or after `NestFactory.create(...)` in `main.ts`. It MUST stay on the raw Express server, registered first, or Nest's catch-all 404 handler will shadow file requests.
- **DON'T** add a `page.tsx` without registering its path in `app-web/src/app/config/navigation.ts`. `middleware.ts` will treat it as invalid and redirect/rewrite the user.
- **DON'T** call `axios` or `fetch` directly from web components/services — always go through `apiClient`. You'll bypass auth injection, 401 handling, and error normalization.
- **DON'T** write to `localStorage` auth keys (`accessToken`, `refreshToken`, `user`) or set the `auth-token` cookie outside `AuthContext`. The cookie and localStorage must stay in sync; only `storeAuthData` / `clearAuthSessionStorage` do this correctly.
- **DON'T** import `@prisma/client` outside `app-backend/src/shared/prisma/`. All feature modules go through `PrismaService` or a repository abstraction.
- **DON'T** call `prisma.$transaction(...)` directly — use `TransactionService` from `shared/prisma/` so the `ClsService` request context is propagated correctly.
- **DON'T** disable the global `ValidationPipe`, the `whitelist: true` flag, or per-route validation. Untrusted fields will be persisted otherwise (and `class-transformer` coercion will silently misbehave).
- **DON'T** persist plaintext credentials, refresh tokens, or password-reset tokens. Hash with `bcrypt` (rounds = default 10 used elsewhere). Token tables store the bcrypt hash, never the UUID itself.
- **DON'T** rotate the refresh token on `POST /auth/refresh` without coordinating — the current contract is that only the access token rotates. Changing this is a breaking change for the web client.
- **DON'T** create new auth guards. Use the existing `JwtAuthGuard` / `LocalAuthGuard` and extend the strategies if behavior must change.
- **DON'T** bypass Husky with `--no-verify`. The pre-commit hook runs `pnpm lint` for a reason.
- **DON'T** commit production secrets into the committed `.env` files. Dev defaults only.

**Security gotchas**

- **`localStorage` tokens are XSS-vulnerable.** This is a known trade-off (the cookie cannot be HttpOnly because the Axios interceptor needs the access token). Don't render unsanitized HTML anywhere; never `dangerouslySetInnerHTML` from user input.
- **Known smell — `console.log` of auth data** in `AuthContext.storeAuthData` (logs `accessToken`, `refreshToken`, and the user object). Remove if you touch that file, and do NOT replicate the pattern elsewhere.
- **Single-origin CORS:** backend allows only `process.env.FRONTEND_URL`. Multi-origin clients require code changes (not just env).
- **Bearer auth + 401 force-logout** is coupled to `error.config.headers.Authorization` being set. If you craft a request without that header, you won't get the auto-logout — that's intentional for public endpoints but easy to miss.
- **404 with `"user not found"` message also force-logs-out.** Don't return that exact phrasing from non-auth endpoints, or you'll boot users out unexpectedly.
- **Swagger UI is permanently mounted at `/api`** in `main.ts` — review whether to gate it in production environments.
- **Conditional Google OAuth:** routes `/auth/google` and `/auth/google/callback` only exist when `GOOGLE_CLIENT_ID` is set. Don't link to them unconditionally from the UI.

**Performance / scaling gotchas**

- **Local-disk uploads** (`app-backend/uploads/`) couple the backend to one writeable instance. Don't horizontally scale until uploads move to shared storage (S3/MinIO/NFS).
- **`recharts` is heavy.** Don't import it into public storefront pages — keep it confined to `/overview` and other private dashboard pages.
- **`AuthProvider.checkAuth()` runs on first mount** and always calls `refreshToken` + `/auth/me`. Don't add additional auto-refresh side-effects on every render or you'll thrash the backend.
- **Login redirect target is hard-coded** to `/catalog/preview` in `AuthContext.login` (after a successful login the user lands there, not at the original `redirect` query param). Be aware when adjusting onboarding flows.
- **Soft-delete is in effect** for `Establishment`, `Category`, `Product` (`deletedAt` column). All list/get queries must filter `deletedAt: null` — verify when adding new query paths.
- **Slug-based public catalog** (`/catalog/:slug`) never trusts the JWT. Don't add JWT-only data to the catalog response shape, or it will leak when buyers fetch it unauthenticated.

**Edge cases to handle**

- `OnboardingStatus` ∈ `{ draft, minimal_completed, completed }`. New onboarding code paths must update the right transition; `POST /auth/onboarding/complete` is the only legal `→ completed` transition.
- WhatsApp login: use `normalizeWhatsapp(...)` from `app-backend/src/modules/sessions/utils/normalize-whatsapp.ts` before any DB lookup against `UserEstablishment.loginWhatsapp`. Raw strings will miss.
- Polymorphic `Contact` rows: `OwnerType` ∈ `{ user, establishment }`, `ContactType` ∈ `{ phone_number, mobile_number, email }`. Don't infer owner type from `contactType`.
- `Establishment ←→ EstablishmentType` is many-to-many via `EstablishmentEstablishmentType`. The `/auth/me` response denormalizes types to a string array — don't change the shape without coordinating with the web client.
- **Swagger description still says** "API for managing investment portfolios" in `main.ts` (legacy). Fix it if you publish the OpenAPI spec externally.

**Things that are intentional (don't "fix")**

- Mixed module patterns (rich vs thin) — both are valid. Match the module's existing style when contributing.
- Backend tests written in Portuguese descriptions — match neighboring tests.
- `dotenv/config` is imported at the top of `main.ts` (before any other backend import that reads env). Don't move it.
- `app-web/.env.local` and `app-backend/.env` are committed with dev defaults — that's intentional for fast onboarding.

---

## Usage Guidelines

**For AI Agents**

- Read this file before implementing any code in this repository.
- Follow ALL rules exactly as documented. When two rules appear to conflict, prefer the more restrictive one and flag the conflict.
- Cross-check architectural questions against `docs/architecture-web.md`, `docs/architecture-backend.md`, and `docs/integration-architecture.md` — they are the long-form authoritative source.
- When adding a new pattern that contradicts a rule here, surface the trade-off explicitly (don't silently violate it). Propose updating this file as part of the same change.
- Update this file whenever you introduce a new convention, anti-pattern, or version pin that the next agent should not have to rediscover.

**For Humans**

- Keep this file lean and focused on agent needs — fewer than ~200 actionable bullets is the target.
- Update when the technology stack, module pattern, or auth/uploads contract changes.
- Review periodically (e.g. quarterly) to delete rules that have become obvious or no longer apply (e.g. when the `console.log` smell in `AuthContext.storeAuthData` is fixed, remove that rule).
- This file is generated by the `bmad-generate-project-context` workflow; regenerate end-to-end if too many rules have drifted.

**Authoritative companion docs**
- `docs/index.md` — documentation map
- `docs/project-overview.md` — executive summary
- `docs/architecture-web.md` / `docs/architecture-backend.md` / `docs/integration-architecture.md`
- `docs/api-contracts-backend.md` / `docs/data-models-backend.md`
- `docs/development-guide-web.md` / `docs/development-guide-backend.md`
- `docs/deployment-guide.md` / `docs/component-inventory-web.md` / `docs/source-tree-analysis.md`
- `app-backend/docs/API_CONSUMER_GUIDE.md` — authoritative API consumer narrative

Last Updated: 2026-05-17

