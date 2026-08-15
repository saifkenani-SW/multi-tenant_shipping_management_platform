/*
  Warnings:

  - A unique constraint covering the columns `[employee_id]` on the table `vehicle_assignment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[vehicle_id]` on the table `vehicle_assignment` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX IF EXISTS "vehicle_assignment_employee_id_is_active_idx";

-- Cleanup: Deactivate duplicate active assignments for the same vehicle (keep the most recent one)
WITH RankedVehicles AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY vehicle_id ORDER BY created_at DESC) as rn
    FROM "vehicle_assignment"
    WHERE "is_active" = true
)
UPDATE "vehicle_assignment"
SET "is_active" = false
WHERE id IN (SELECT id FROM RankedVehicles WHERE rn > 1);

-- Cleanup: Deactivate duplicate active assignments for the same employee (keep the most recent one)
WITH RankedEmployees AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY employee_id ORDER BY created_at DESC) as rn
    FROM "vehicle_assignment"
    WHERE "is_active" = true
)
UPDATE "vehicle_assignment"
SET "is_active" = false
WHERE id IN (SELECT id FROM RankedEmployees WHERE rn > 1);

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_employee_assignment" ON "vehicle_assignment"("employee_id") WHERE ("is_active" = true);

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_vehicle_assignment" ON "vehicle_assignment"("vehicle_id") WHERE ("is_active" = true);
