-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'COD';

-- AlterTable
ALTER TABLE "tenant_pricing_settings" ALTER COLUMN "default_currency" SET DEFAULT 'SR';
