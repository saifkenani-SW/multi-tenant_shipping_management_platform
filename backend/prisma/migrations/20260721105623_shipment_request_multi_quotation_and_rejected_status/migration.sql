-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'REJECTED';

-- DropIndex
DROP INDEX "quotation_shipment_request_id_key";
