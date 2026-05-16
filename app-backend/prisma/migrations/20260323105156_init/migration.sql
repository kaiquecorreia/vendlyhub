-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('google', 'email', 'apple');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('cpf', 'cnpj');

-- CreateEnum
CREATE TYPE "EstablishmentType" AS ENUM ('restaurant', 'hotel', 'store');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('user', 'establishment');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('phone_number', 'mobile_number', 'email');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('owner', 'admin', 'staff');

-- CreateTable
CREATE TABLE "user" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "auth_provider" (
    "auth_provider_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "AuthProviderType" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_provider_pkey" PRIMARY KEY ("auth_provider_id")
);

-- CreateTable
CREATE TABLE "establishment" (
    "establishment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "document" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "establishment_type" "EstablishmentType" NOT NULL,
    "logo" TEXT,
    "address_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establishment_pkey" PRIMARY KEY ("establishment_id")
);

-- CreateTable
CREATE TABLE "address" (
    "address_id" TEXT NOT NULL,
    "cep" TEXT,
    "street" TEXT,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT,
    "state" TEXT,

    CONSTRAINT "address_pkey" PRIMARY KEY ("address_id")
);

-- CreateTable
CREATE TABLE "contact" (
    "contact_id" TEXT NOT NULL,
    "owner_type" "OwnerType" NOT NULL,
    "owner_id" TEXT NOT NULL,
    "contact_type" "ContactType" NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "establishment_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("contact_id")
);

-- CreateTable
CREATE TABLE "user_establishment" (
    "user_id" TEXT NOT NULL,
    "establishment_id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,

    CONSTRAINT "user_establishment_pkey" PRIMARY KEY ("user_id","establishment_id")
);

-- CreateTable
CREATE TABLE "auth_token" (
    "auth_token_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "device" TEXT,
    "ip" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_token_pkey" PRIMARY KEY ("auth_token_id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "password_reset_token_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "reset_token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("password_reset_token_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "auth_provider_provider_provider_id_key" ON "auth_provider"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_provider_user_id_provider_key" ON "auth_provider"("user_id", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "establishment_document_key" ON "establishment"("document");

-- CreateIndex
CREATE INDEX "contact_owner_id_owner_type_idx" ON "contact"("owner_id", "owner_type");

-- CreateIndex
CREATE INDEX "auth_token_user_id_idx" ON "auth_token"("user_id");

-- CreateIndex
CREATE INDEX "auth_token_expires_at_idx" ON "auth_token"("expires_at");

-- CreateIndex
CREATE INDEX "password_reset_token_user_id_idx" ON "password_reset_token"("user_id");

-- AddForeignKey
ALTER TABLE "auth_provider" ADD CONSTRAINT "auth_provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "establishment" ADD CONSTRAINT "establishment_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("address_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishment"("establishment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_establishment" ADD CONSTRAINT "user_establishment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_establishment" ADD CONSTRAINT "user_establishment_establishment_id_fkey" FOREIGN KEY ("establishment_id") REFERENCES "establishment"("establishment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_token" ADD CONSTRAINT "auth_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
