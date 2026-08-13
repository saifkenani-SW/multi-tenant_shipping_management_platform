/*
  Warnings:

  - Added the required column `sender_name` to the `customer_shipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sender_phone` to the `customer_shipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customer_shipment" ADD COLUMN     "sender_name" VARCHAR(255) NOT NULL,
ADD COLUMN     "sender_phone" VARCHAR(50) NOT NULL;
