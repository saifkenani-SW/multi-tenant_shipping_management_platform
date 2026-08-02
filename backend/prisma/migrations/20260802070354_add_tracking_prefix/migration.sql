/*
  Warnings:

  - You are about to drop the column `customer_profile_id` on the `customer_shipment` table. All the data in the column will be lost.
  - You are about to drop the column `qr_code_url` on the `parcel` table. All the data in the column will be lost.
  - Added the required column `sender_customer_profile_id` to the `customer_shipment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "customer_shipment" DROP CONSTRAINT "customer_shipment_customer_profile_id_fkey";

-- DropIndex
DROP INDEX "idx_customer_shipment_customer";

-- AlterTable
ALTER TABLE "customer_shipment" DROP COLUMN "customer_profile_id",
ADD COLUMN     "receiver_customer_profile_id" UUID,
ADD COLUMN     "sender_customer_profile_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "parcel" DROP COLUMN "qr_code_url";

-- AlterTable
ALTER TABLE "tenant_operational_settings" ADD COLUMN     "tracking_prefix" VARCHAR(10);

-- CreateIndex
CREATE INDEX "idx_customer_shipment_sender" ON "customer_shipment"("sender_customer_profile_id");

-- CreateIndex
CREATE INDEX "idx_customer_shipment_receiver" ON "customer_shipment"("receiver_customer_profile_id");

-- CreateIndex
CREATE INDEX "parcel_current_org_unit_id_idx" ON "parcel"("current_org_unit_id");

-- CreateIndex
CREATE INDEX "parcel_customer_shipment_id_idx" ON "parcel"("customer_shipment_id");

-- CreateIndex
CREATE INDEX "parcel_movement_organization_unit_id_created_at_idx" ON "parcel_movement"("organization_unit_id", "created_at");

-- CreateIndex
CREATE INDEX "parcel_movement_parcel_id_created_at_idx" ON "parcel_movement"("parcel_id", "created_at");

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_sender_customer_profile_id_fkey" FOREIGN KEY ("sender_customer_profile_id") REFERENCES "customer_profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_receiver_customer_profile_id_fkey" FOREIGN KEY ("receiver_customer_profile_id") REFERENCES "customer_profile"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
