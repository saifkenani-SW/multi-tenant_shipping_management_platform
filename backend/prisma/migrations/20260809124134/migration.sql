-- AlterTable
ALTER TABLE "customer_shipment" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "parcel" ADD COLUMN     "destination_org_unit_id" UUID,
ADD COLUMN     "label_key" VARCHAR(500),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;
