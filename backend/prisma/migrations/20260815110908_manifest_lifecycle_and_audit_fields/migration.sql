-- AlterEnum
BEGIN;
CREATE TYPE "ManifestStatus_new" AS ENUM ('OPEN', 'READY_FOR_DISPATCH', 'IN_TRANSIT', 'COMPLETED');
ALTER TABLE "public"."transport_manifest" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "transport_manifest" ALTER COLUMN "status" TYPE "ManifestStatus_new" USING ("status"::text::"ManifestStatus_new");
ALTER TYPE "ManifestStatus" RENAME TO "ManifestStatus_old";
ALTER TYPE "ManifestStatus_new" RENAME TO "ManifestStatus";
DROP TYPE "public"."ManifestStatus_old";
ALTER TABLE "transport_manifest" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "transport_manifest" DROP CONSTRAINT "transport_manifest_trip_id_fkey";

-- AlterTable
ALTER TABLE "manifest_item" ADD COLUMN "added_by_employee_id" UUID,
ADD COLUMN "added_by_employee_name" VARCHAR(255);

-- AlterTable
ALTER TABLE "transport_manifest" ADD COLUMN "created_by_employee_id" UUID,
ADD COLUMN "created_by_employee_name" VARCHAR(255),
ALTER COLUMN "trip_id" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- CreateIndex
CREATE INDEX "transport_manifest_tenant_id_status_trip_id_idx" ON "transport_manifest"("tenant_id", "status", "trip_id");

-- AddForeignKey
ALTER TABLE "manifest_item" ADD CONSTRAINT "manifest_item_added_by_employee_id_fkey" FOREIGN KEY ("added_by_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transport_manifest" ADD CONSTRAINT "transport_manifest_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transport_manifest" ADD CONSTRAINT "transport_manifest_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
