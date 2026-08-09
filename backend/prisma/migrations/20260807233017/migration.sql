/*
  Warnings:

  - A unique constraint covering the columns `[approved_quotation_id]` on the table `shipment_request` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "shipment_request" ADD COLUMN     "approved_quotation_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "shipment_request_approved_quotation_id_key" ON "shipment_request"("approved_quotation_id");

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_approved_quotation_id_fkey" FOREIGN KEY ("approved_quotation_id") REFERENCES "quotation"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
