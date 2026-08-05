-- CreateEnum
CREATE TYPE "ParcelType" AS ENUM ('DOCUMENT', 'PACKAGE', 'FRAGILE', 'PERISHABLE', 'HAZARDOUS', 'LIQUID');

-- CreateEnum
CREATE TYPE "HandlingFeeType" AS ENUM ('FRAGILE', 'HAZARDOUS', 'PERISHABLE', 'TEMPERATURE_SENSITIVE');

-- AlterTable
ALTER TABLE "invoice" ADD COLUMN     "handling_fees" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "parcel" ADD COLUMN     "is_fragile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parcel_type" "ParcelType" NOT NULL DEFAULT 'PACKAGE',
ADD COLUMN     "requires_upright_handling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "temperature_sensitive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "handling_fee_rule" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "fee_type" "HandlingFeeType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "handling_fee_rule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_tenant_handling_fee" ON "handling_fee_rule"("tenant_id", "fee_type");

-- AddForeignKey
ALTER TABLE "handling_fee_rule" ADD CONSTRAINT "handling_fee_rule_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
