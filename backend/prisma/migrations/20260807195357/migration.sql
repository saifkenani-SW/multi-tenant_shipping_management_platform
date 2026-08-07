/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,origin_zone_id,destination_zone_id,service_level]` on the table `zone_pricing_matrix` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ServiceLevel" AS ENUM ('STANDARD', 'EXPRESS', 'SAME_DAY', 'REFRIGERATED');

-- DropIndex
DROP INDEX "uq_pricing_route";

-- AlterTable
ALTER TABLE "customer_shipment" ADD COLUMN     "service_level" "ServiceLevel" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "parcel" ADD COLUMN     "service_level" "ServiceLevel" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "quotation" ADD COLUMN     "service_level" "ServiceLevel" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "zone_pricing_matrix" ADD COLUMN     "service_level" "ServiceLevel" NOT NULL DEFAULT 'STANDARD';

-- CreateIndex
CREATE UNIQUE INDEX "uq_pricing_route_service" ON "zone_pricing_matrix"("tenant_id", "origin_zone_id", "destination_zone_id", "service_level");
