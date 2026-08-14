-- An invoice belongs to a shipment, not to a customer account.
--
-- Most senders walk into a branch and pay at the counter without ever
-- registering, so requiring a customer_profile_id made the common case
-- unbillable. The two parties are recorded instead as the names and phones
-- copied from the shipment at the moment it was billed. Copying rather than
-- referencing also means a later edit to someone's profile cannot silently
-- rewrite what an issued invoice says.

-- Added nullable first so existing rows survive the statement.
ALTER TABLE "invoice" ADD COLUMN "sender_name" VARCHAR(255);
ALTER TABLE "invoice" ADD COLUMN "sender_phone" VARCHAR(50);
ALTER TABLE "invoice" ADD COLUMN "receiver_name" VARCHAR(255);
ALTER TABLE "invoice" ADD COLUMN "receiver_phone" VARCHAR(50);

-- Backfill from the shipment each invoice was raised for. An invoice with no
-- shipment, or one whose shipment is gone, keeps a placeholder rather than
-- blocking the migration.
UPDATE "invoice" AS i
SET "sender_name"    = COALESCE(s."sender_name", 'Unknown'),
    "sender_phone"   = COALESCE(s."sender_phone", 'Unknown'),
    "receiver_name"  = COALESCE(s."receiver_name", 'Unknown'),
    "receiver_phone" = COALESCE(s."receiver_phone", 'Unknown')
FROM "customer_shipment" AS s
WHERE i."customer_shipment_id" = s."id";

UPDATE "invoice"
SET "sender_name"    = COALESCE("sender_name", 'Unknown'),
    "sender_phone"   = COALESCE("sender_phone", 'Unknown'),
    "receiver_name"  = COALESCE("receiver_name", 'Unknown'),
    "receiver_phone" = COALESCE("receiver_phone", 'Unknown');

ALTER TABLE "invoice" ALTER COLUMN "sender_name" SET NOT NULL;
ALTER TABLE "invoice" ALTER COLUMN "sender_phone" SET NOT NULL;
ALTER TABLE "invoice" ALTER COLUMN "receiver_name" SET NOT NULL;
ALTER TABLE "invoice" ALTER COLUMN "receiver_phone" SET NOT NULL;

-- The customer link goes away only after the contact details above are in
-- place, so no invoice is ever left without a way to identify its parties.
ALTER TABLE "invoice" DROP CONSTRAINT IF EXISTS "invoice_customer_profile_id_fkey";
DROP INDEX IF EXISTS "idx_invoice_customer";
ALTER TABLE "invoice" DROP COLUMN IF EXISTS "customer_profile_id";

-- Looking an invoice up by the phone on it is now the way staff find it.
CREATE INDEX "idx_invoice_sender_phone" ON "invoice"("tenant_id", "sender_phone");
