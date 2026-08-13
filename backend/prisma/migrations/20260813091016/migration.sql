/*
  Warnings:

  - You are about to drop the column `approved_quotation_id` on the `customer_shipment` table. All the data in the column will be lost.
  - You are about to drop the column `service_level` on the `parcel` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "customer_shipment" DROP CONSTRAINT "customer_shipment_approved_quotation_id_fkey";

-- AlterTable
ALTER TABLE "customer_shipment" DROP COLUMN "approved_quotation_id";

-- AlterTable
ALTER TABLE "parcel" DROP COLUMN "service_level";
