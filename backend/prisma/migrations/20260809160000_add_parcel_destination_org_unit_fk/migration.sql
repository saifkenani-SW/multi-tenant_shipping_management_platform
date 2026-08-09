-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_destination_org_unit_id_fkey" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
