/*
  Warnings:

  - A unique constraint covering the columns `[employee_id]` on the table `vehicle_assignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vehicle_id]` on the table `vehicle_assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "vehicle_assignment_employee_id_is_active_idx";

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_employee_assignment" ON "vehicle_assignment"("employee_id") WHERE ("is_active" = true);

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_vehicle_assignment" ON "vehicle_assignment"("vehicle_id") WHERE ("is_active" = true);
