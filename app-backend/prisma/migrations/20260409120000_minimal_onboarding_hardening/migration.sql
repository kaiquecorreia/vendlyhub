-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('draft', 'minimal_completed', 'completed');

-- AlterTable
ALTER TABLE "establishment"
ADD COLUMN "onboarding_status" "OnboardingStatus" NOT NULL DEFAULT 'draft',
ALTER COLUMN "document" DROP NOT NULL,
ALTER COLUMN "document_type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_establishment"
ADD COLUMN "login_whatsapp" TEXT,
ADD COLUMN "minimal_profile_completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "user_establishment_login_whatsapp_key" ON "user_establishment"("login_whatsapp");

-- Backfill onboarding status based on existing records
UPDATE "establishment"
SET "onboarding_status" = 'completed'
WHERE "document" IS NOT NULL AND "document_type" IS NOT NULL;

-- Backfill minimal profile completion for existing user links
UPDATE "user_establishment"
SET "minimal_profile_completed" = true
WHERE "minimal_profile_completed" = false;
