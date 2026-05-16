# Module documentation

Backend code is organized by NestJS feature modules under `src/modules/`. Each page below describes one module’s role, structure, and how it connects to the rest of the app.

| Module | Document |
|--------|----------|
| Users | [users.md](users.md) |
| Sessions (auth, tokens, OAuth) | [sessions.md](sessions.md) |
| Addresses | [addresses.md](addresses.md) |
| Contacts | [contacts.md](contacts.md) |
| Establishments | [establishments.md](establishments.md) |
| Products | [products.md](products.md) |

**HTTP clients:** route-level usage is documented in [API_CONSUMER_GUIDE.md](../API_CONSUMER_GUIDE.md). OpenAPI UI is served at `/api` when the app runs.

**Shared infrastructure:** database access and transactions live under `src/shared/prisma/` (used by all modules).
