/*
  Warnings:

  - The values [WAITING_PRICING] on the enum `RequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
ALTER TYPE "QuotationStatus" ADD VALUE 'WAITING_PRICING';

-- AlterEnum
BEGIN;
CREATE TYPE "RequestStatus_new" AS ENUM ('PENDING', 'CUSTOMER_APPROVED', 'COMPANY_ACCEPTED', 'REJECTED', 'CONVERTED', 'CANCELLED', 'EXPIRED');
ALTER TABLE "public"."shipment_request" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "shipment_request" ALTER COLUMN "status" TYPE "RequestStatus_new" USING ("status"::text::"RequestStatus_new");
ALTER TYPE "RequestStatus" RENAME TO "RequestStatus_old";
ALTER TYPE "RequestStatus_new" RENAME TO "RequestStatus";
DROP TYPE "public"."RequestStatus_old";
ALTER TABLE "shipment_request" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
