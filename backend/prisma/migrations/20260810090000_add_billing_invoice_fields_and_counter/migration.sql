-- Remove COD from PaymentMethod.
-- Cash collected on handover is still CASH; COD described where it was paid,
-- not how, so it was never a distinct method.
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE', 'BANK_TRANSFER');
ALTER TABLE "payment"
  ALTER COLUMN "payment_method" TYPE "PaymentMethod"
  USING (
    CASE "payment_method"::text
      WHEN 'COD' THEN 'CASH'
      ELSE "payment_method"::text
    END
  )::"PaymentMethod";
DROP TYPE "PaymentMethod_old";

-- Optimistic locking for concurrent payments against one invoice.
ALTER TABLE "invoice" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;

-- Branch visibility: staff at either end of the route handle this invoice.
-- Backfilled from the owning shipment; invoices without one fall back to the
-- first organization unit of their tenant so the NOT NULL can be applied.
ALTER TABLE "invoice" ADD COLUMN "origin_org_unit_id" UUID;
ALTER TABLE "invoice" ADD COLUMN "destination_org_unit_id" UUID;

UPDATE "invoice" i
SET "origin_org_unit_id" = cs."origin_org_unit_id",
    "destination_org_unit_id" = cs."destination_org_unit_id"
FROM "customer_shipment" cs
WHERE i."customer_shipment_id" = cs."id";

UPDATE "invoice" i
SET "origin_org_unit_id" = COALESCE(
      i."origin_org_unit_id",
      (SELECT ou."id" FROM "organization_unit" ou WHERE ou."tenant_id" = i."tenant_id" LIMIT 1)
    ),
    "destination_org_unit_id" = COALESCE(
      i."destination_org_unit_id",
      (SELECT ou."id" FROM "organization_unit" ou WHERE ou."tenant_id" = i."tenant_id" LIMIT 1)
    )
WHERE i."origin_org_unit_id" IS NULL OR i."destination_org_unit_id" IS NULL;

ALTER TABLE "invoice" ALTER COLUMN "origin_org_unit_id" SET NOT NULL;
ALTER TABLE "invoice" ALTER COLUMN "destination_org_unit_id" SET NOT NULL;

ALTER TABLE "invoice" ADD CONSTRAINT "invoice_origin_org_unit_id_fkey"
  FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_destination_org_unit_id_fkey"
  FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit"("id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE INDEX "idx_invoice_tenant_status" ON "invoice"("tenant_id", "status");
CREATE INDEX "idx_invoice_origin_org_unit" ON "invoice"("origin_org_unit_id");
CREATE INDEX "idx_invoice_destination_org_unit" ON "invoice"("destination_org_unit_id");

-- Running number behind invoice_number, one row per tenant per year.
CREATE TABLE "invoice_counter" (
    "tenant_id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_counter_pkey" PRIMARY KEY ("tenant_id", "year")
);

ALTER TABLE "invoice_counter" ADD CONSTRAINT "invoice_counter_tenant_id_fkey"
  FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- Syrian pound, replacing the placeholder default.
ALTER TABLE "tenant_pricing_settings" ALTER COLUMN "default_currency" SET DEFAULT 'SYP';
