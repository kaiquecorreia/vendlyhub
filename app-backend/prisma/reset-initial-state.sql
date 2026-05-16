-- -----------------------------------------------------------------------------
-- Estado inicial dos dados (PostgreSQL)
--
-- Remove usuários, estabelecimentos, pedidos, produtos etc., mantendo o schema
-- e o histórico em _prisma_migrations intactos.
-- A tabela establishment_type (tipos pré-cadastrados da migration) é preservada.
--
-- Para zerar também o schema e reaplicar migrations, prefira:
--   npx prisma migrate reset
--
-- Uso:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f prisma/reset-initial-state.sql
-- -----------------------------------------------------------------------------

BEGIN;

TRUNCATE TABLE
  "order_item",
  "order",
  "product",
  "category",
  "establishment_establishment_type",
  "user_establishment",
  "contact",
  "auth_token",
  "password_reset_token",
  "auth_provider",
  "establishment",
  "address",
  "user"
RESTART IDENTITY CASCADE;

COMMIT;

-- Opcional: descomente para também limpar os tipos de estabelecimento e
-- recarregar o mesmo seed da migration 20260330220000_establishment_types_m2m.
--
-- BEGIN;
-- TRUNCATE TABLE "establishment_establishment_type", "establishment_type" RESTART IDENTITY CASCADE;
-- INSERT INTO "establishment_type" ("establishment_type_id", "name") VALUES
-- (gen_random_uuid(), 'Restaurantes'),
-- (gen_random_uuid(), 'Pizzarias'),
-- (gen_random_uuid(), 'Hamburguerias'),
-- (gen_random_uuid(), 'Comida brasileira'),
-- (gen_random_uuid(), 'Comida japonesa / oriental'),
-- (gen_random_uuid(), 'Comida italiana'),
-- (gen_random_uuid(), 'Comida árabe'),
-- (gen_random_uuid(), 'Comida mexicana'),
-- (gen_random_uuid(), 'Comida chinesa'),
-- (gen_random_uuid(), 'Comida saudável / fit'),
-- (gen_random_uuid(), 'Marmitas'),
-- (gen_random_uuid(), 'Padarias'),
-- (gen_random_uuid(), 'Confeitarias'),
-- (gen_random_uuid(), 'Docerias'),
-- (gen_random_uuid(), 'Sorveterias'),
-- (gen_random_uuid(), 'Lojas de açaí'),
-- (gen_random_uuid(), 'Cafeterias'),
-- (gen_random_uuid(), 'Casas de sucos'),
-- (gen_random_uuid(), 'Bares (com regras para bebidas alcoólicas)'),
-- (gen_random_uuid(), 'Lanchonetes'),
-- (gen_random_uuid(), 'Pastelarias'),
-- (gen_random_uuid(), 'Creperias'),
-- (gen_random_uuid(), 'Food trucks'),
-- (gen_random_uuid(), 'Cozinhas virtuais (dark kitchens)'),
-- (gen_random_uuid(), 'Mercados'),
-- (gen_random_uuid(), 'Minimercados'),
-- (gen_random_uuid(), 'Hortifrúti'),
-- (gen_random_uuid(), 'Lojas de conveniência'),
-- (gen_random_uuid(), 'Empórios'),
-- (gen_random_uuid(), 'Adegas'),
-- (gen_random_uuid(), 'Farmácias'),
-- (gen_random_uuid(), 'Pet shops');
-- COMMIT;
