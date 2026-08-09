-- AlterTable
ALTER TABLE "shipment_request" ADD COLUMN     "expected_height_cm" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "expected_length_cm" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "expected_width_cm" DECIMAL(10,2) NOT NULL DEFAULT 0;
