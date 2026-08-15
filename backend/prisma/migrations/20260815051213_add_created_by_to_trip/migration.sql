-- AlterTable
ALTER TABLE "trip" ADD COLUMN     "created_by_employee_id" UUID;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
