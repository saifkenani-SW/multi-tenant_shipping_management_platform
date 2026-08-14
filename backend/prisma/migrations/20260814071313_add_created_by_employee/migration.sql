/*
  Warnings:

  - You are about to drop the column `receiver_customer_profile_id` on the `customer_shipment` table. All the data in the column will be lost.
  - You are about to drop the column `sender_customer_profile_id` on the `customer_shipment` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "ParcelStatus" ADD VALUE 'ARRIVED_AT_UNIT';

-- DropForeignKey
ALTER TABLE "customer_shipment" DROP CONSTRAINT "customer_shipment_receiver_customer_profile_id_fkey";

-- DropForeignKey
ALTER TABLE "customer_shipment" DROP CONSTRAINT "customer_shipment_sender_customer_profile_id_fkey";

-- DropIndex
DROP INDEX "idx_customer_shipment_receiver";

-- DropIndex
DROP INDEX "idx_customer_shipment_sender";

-- AlterTable
ALTER TABLE "customer_shipment" DROP COLUMN "receiver_customer_profile_id",
DROP COLUMN "sender_customer_profile_id",
ADD COLUMN     "created_by_employee_id" UUID,
ADD COLUMN     "created_by_employee_name" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
