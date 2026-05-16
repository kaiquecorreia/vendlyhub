-- Normalize establishment mobile numbers to digits only
UPDATE "contact"
SET "value" = regexp_replace("value", '\D', '', 'g')
WHERE "owner_type" = 'establishment'
  AND "contact_type" = 'mobile_number';

-- Enforce numeric storage for establishment mobile numbers
ALTER TABLE "contact"
ADD CONSTRAINT "contact_establishment_mobile_digits_only_chk"
CHECK (
  "owner_type" <> 'establishment'
  OR "contact_type" <> 'mobile_number'
  OR "value" ~ '^[0-9]+$'
);

-- Block migration when there are collisions after normalization
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "contact"
    WHERE "owner_type" = 'establishment'
      AND "contact_type" = 'mobile_number'
    GROUP BY "value"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate establishment mobile_number values found after normalization';
  END IF;
END $$;

-- Prevent slug collisions across establishments
CREATE UNIQUE INDEX "contact_establishment_mobile_number_unique_value_idx"
ON "contact" ("value")
WHERE "owner_type" = 'establishment'
  AND "contact_type" = 'mobile_number';
