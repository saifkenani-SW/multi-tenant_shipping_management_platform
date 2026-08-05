/*
  Warnings:

  - You are about to drop the column `receiver_address` on the `customer_shipment` table. All the data in the column will be lost.
  - You are about to drop the column `additional_photo_url` on the `proof_of_delivery` table. All the data in the column will be lost.
  - You are about to drop the column `id_photo_url` on the `proof_of_delivery` table. All the data in the column will be lost.
  - You are about to drop the column `parcel_photo_url` on the `proof_of_delivery` table. All the data in the column will be lost.
  - You are about to drop the column `signature_url` on the `proof_of_delivery` table. All the data in the column will be lost.
  - You are about to drop the column `destination_org_unit_id` on the `shipment_request` table. All the data in the column will be lost.
  - You are about to drop the column `origin_org_unit_id` on the `shipment_request` table. All the data in the column will be lost.
  - You are about to drop the column `receiver_address` on the `shipment_request` table. All the data in the column will be lost.
  - You are about to drop the column `sender_address` on the `shipment_request` table. All the data in the column will be lost.
  - Added the required column `destination_org_unit_id` to the `customer_shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin_org_unit_id` to the `customer_shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination_org_unit_id` to the `quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin_org_unit_id` to the `quotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination_global_location_id` to the `shipment_request` table without a default value. This is not possible if the table is not empty.
  - Added the required column `origin_global_location_id` to the `shipment_request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'QUOTATION';

-- DropForeignKey
ALTER TABLE "shipment_request" DROP CONSTRAINT "shipment_request_destination_org_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "shipment_request" DROP CONSTRAINT "shipment_request_origin_org_unit_id_fkey";

-- AlterTable
ALTER TABLE "customer_shipment" DROP COLUMN "receiver_address",
ADD COLUMN     "destination_org_unit_id" UUID NOT NULL,
ADD COLUMN     "origin_org_unit_id" UUID NOT NULL,
ADD COLUMN     "sender_national_id" VARCHAR(50);

-- AlterTable
ALTER TABLE "parcel" ADD COLUMN     "category" VARCHAR(100),
ADD COLUMN     "description" VARCHAR(500);

-- AlterTable
ALTER TABLE "proof_of_delivery" DROP COLUMN "additional_photo_url",
DROP COLUMN "id_photo_url",
DROP COLUMN "parcel_photo_url",
DROP COLUMN "signature_url",
ADD COLUMN     "additional_photo_key" VARCHAR(500),
ADD COLUMN     "id_photo_key" VARCHAR(500),
ADD COLUMN     "parcel_photo_key" VARCHAR(500),
ADD COLUMN     "signature_key" VARCHAR(500);

-- AlterTable
ALTER TABLE "quotation" ADD COLUMN     "destination_org_unit_id" UUID NOT NULL,
ADD COLUMN     "origin_org_unit_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "shipment_request" DROP COLUMN "destination_org_unit_id",
DROP COLUMN "origin_org_unit_id",
DROP COLUMN "receiver_address",
DROP COLUMN "sender_address",
ADD COLUMN     "destination_global_location_id" UUID NOT NULL,
ADD COLUMN     "origin_global_location_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "tenant_operational_settings" ADD COLUMN     "require_sender_national_id" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "quotation_shipment_request_id_idx" ON "quotation"("shipment_request_id");

-- CreateIndex
CREATE INDEX "quotation_tenant_id_idx" ON "quotation"("tenant_id");

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_origin_org_unit_id_fkey" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_destination_org_unit_id_fkey" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_origin_org_unit_id_fkey" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_destination_org_unit_id_fkey" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_origin_global_location_id_fkey" FOREIGN KEY ("origin_global_location_id") REFERENCES "global_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_destination_global_location_id_fkey" FOREIGN KEY ("destination_global_location_id") REFERENCES "global_location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
