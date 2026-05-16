-- CreateTable
CREATE TABLE "establishment_type" (
    "establishment_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "establishment_type_pkey" PRIMARY KEY ("establishment_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "establishment_type_name_key" ON "establishment_type"("name");

-- Seed establishment types (Portuguese labels)
INSERT INTO "establishment_type" ("establishment_type_id", "name") VALUES
(gen_random_uuid(), 'Restaurantes'),
(gen_random_uuid(), 'Pizzarias'),
(gen_random_uuid(), 'Hamburguerias'),
(gen_random_uuid(), 'Comida brasileira'),
(gen_random_uuid(), 'Comida japonesa / oriental'),
(gen_random_uuid(), 'Comida italiana'),
(gen_random_uuid(), 'Comida árabe'),
(gen_random_uuid(), 'Comida mexicana'),
(gen_random_uuid(), 'Comida chinesa'),
(gen_random_uuid(), 'Comida saudável / fit'),
(gen_random_uuid(), 'Marmitas'),
(gen_random_uuid(), 'Padarias'),
(gen_random_uuid(), 'Confeitarias'),
(gen_random_uuid(), 'Docerias'),
(gen_random_uuid(), 'Sorveterias'),
(gen_random_uuid(), 'Lojas de açaí'),
(gen_random_uuid(), 'Cafeterias'),
(gen_random_uuid(), 'Casas de sucos'),
(gen_random_uuid(), 'Bares (com regras para bebidas alcoólicas)'),
(gen_random_uuid(), 'Lanchonetes'),
(gen_random_uuid(), 'Pastelarias'),
(gen_random_uuid(), 'Creperias'),
(gen_random_uuid(), 'Food trucks'),
(gen_random_uuid(), 'Cozinhas virtuais (dark kitchens)'),
(gen_random_uuid(), 'Mercados'),
(gen_random_uuid(), 'Minimercados'),
(gen_random_uuid(), 'Hortifrúti'),
(gen_random_uuid(), 'Lojas de conveniência'),
(gen_random_uuid(), 'Empórios'),
(gen_random_uuid(), 'Adegas'),
(gen_random_uuid(), 'Farmácias'),
(gen_random_uuid(), 'Pet shops');

-- CreateTable
CREATE TABLE "establishment_establishment_type" (
    "establishment_id" TEXT NOT NULL,
    "establishment_type_id" TEXT NOT NULL,

    CONSTRAINT "establishment_establishment_type_pkey" PRIMARY KEY ("establishment_id","establishment_type_id")
);

-- AddForeignKey
ALTER TABLE "establishment_establishment_type" ADD CONSTRAINT "establishment_establishment_type_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishment"("establishment_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "establishment_establishment_type" ADD CONSTRAINT "establishment_establishment_type_establishment_type_id_fkey" FOREIGN KEY ("establishment_type_id") REFERENCES "establishment_type"("establishment_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from legacy enum column
INSERT INTO "establishment_establishment_type" ("establishment_id", "establishment_type_id")
SELECT e."establishment_id", t."establishment_type_id"
FROM "establishment" e
INNER JOIN "establishment_type" t ON t."name" = (
  CASE e."establishment_type"::text
    WHEN 'restaurant' THEN 'Restaurantes'
    WHEN 'hotel' THEN 'Cafeterias'
    WHEN 'store' THEN 'Mercados'
    ELSE NULL
  END
);

-- Drop legacy column
ALTER TABLE "establishment" DROP COLUMN "establishment_type";

-- Drop legacy enum type
DROP TYPE "EstablishmentType";
