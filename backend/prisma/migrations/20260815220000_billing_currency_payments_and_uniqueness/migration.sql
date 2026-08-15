-- Billing: SY/USD currency enum, one invoice per shipment.

CREATE TYPE "Currency" AS ENUM ('SY', 'USD');

ALTER TABLE "invoice" ALTER COLUMN "currency" DROP DEFAULT;

ALTER TABLE "invoice"
  ALTER COLUMN "currency" TYPE "Currency"
  USING (
    CASE
      WHEN UPPER(TRIM(currency)) IN ('USD', 'US') THEN 'USD'::"Currency"
      ELSE 'SY'::"Currency"
    END
  );

ALTER TABLE "invoice" ALTER COLUMN "currency" SET DEFAULT 'SY'::"Currency";
ALTER TABLE "invoice" ALTER COLUMN "currency" SET NOT NULL;

ALTER TABLE "tenant_pricing_settings" ALTER COLUMN "default_currency" DROP DEFAULT;

ALTER TABLE "tenant_pricing_settings"
  ALTER COLUMN "default_currency" TYPE "Currency"
  USING (
    CASE
      WHEN UPPER(TRIM(default_currency)) IN ('USD', 'US') THEN 'USD'::"Currency"
      ELSE 'SY'::"Currency"
    END
  );

ALTER TABLE "tenant_pricing_settings" ALTER COLUMN "default_currency" SET DEFAULT 'SY'::"Currency";
ALTER TABLE "tenant_pricing_settings" ALTER COLUMN "default_currency" SET NOT NULL;

-- Keep the oldest invoice when a shipment already has more than one.
DELETE FROM "invoice" AS i
WHERE i."customer_shipment_id" IS NOT NULL
  AND i.id NOT IN (
    SELECT kept.id
    FROM (
      SELECT DISTINCT ON ("customer_shipment_id") id
      FROM "invoice"
      WHERE "customer_shipment_id" IS NOT NULL
      ORDER BY "customer_shipment_id", "created_at" ASC, id ASC
    ) AS kept
  );

CREATE UNIQUE INDEX "uq_invoice_shipment" ON "invoice" ("customer_shipment_id");
