/*
  Warnings:

  - Made the column `expected_total_weight_kg` on table `shipment_request` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'WAITING_PRICING';

-- AlterTable
ALTER TABLE "shipment_request" ALTER COLUMN "expected_total_weight_kg" SET NOT NULL;

-- AlterTable
ALTER TABLE "tenant_pricing_settings" ALTER COLUMN "default_currency" SET DEFAULT 'SR';
