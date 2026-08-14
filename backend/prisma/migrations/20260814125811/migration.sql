/*
  Warnings:

  - Added the required column `delivered_by_employee_name` to the `proof_of_delivery` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "proof_of_delivery" ADD COLUMN     "delivered_by_employee_name" VARCHAR(255) NOT NULL;
