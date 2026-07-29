-- AlterTable
ALTER TABLE "shipment_request" ADD COLUMN     "destination_org_unit_id" UUID,
ADD COLUMN     "origin_org_unit_id" UUID;

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_origin_org_unit_id_fkey" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_destination_org_unit_id_fkey" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
