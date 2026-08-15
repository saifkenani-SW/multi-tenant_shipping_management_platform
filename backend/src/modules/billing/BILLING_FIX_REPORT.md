# Billing fix report

What billing is for, the problems that were in the way, and how each one was fixed.

## Billing responsibilities (after the fix)

1. **Raise one invoice with every shipment.** Creating a shipment and creating its invoice are the same act. If billing fails, the shipment is rolled back. There is no HTTP API to create an invoice.
2. **Bill in `SY` or `USD` only.** Currency is a database enum. The tenant's default is used when the invoice is raised. Legacy codes (`SYP`, `SR`, `SAR`) map to `SY`.
3. **Accept partial payments any number of times**, with two hard limits:
   - a payment cannot exceed the remaining balance (no overpayment)
   - a payment must be at least **1000 SY** or **100 USD**, unless the remaining balance is smaller — then only that remainder is accepted so the last payment can settle
4. **Refuse handover until the invoice is fully paid.** Proof of delivery records an optional payment first (COD), then refuses delivery unless status is `PAID`.
5. **Cancel the invoice when the shipment is cancelled.** Unpaid invoices are voided. If money was taken, it is refunded **only while the shipment is still PENDING**. A **RETURNED** shipment is never refunded and its invoice is left as collected.
6. **Number invoices** as `PREFIX-INV-YYYY-NNNNN` per tenant per year.
7. **Mark unpaid / partially paid invoices overdue** once the due date has passed (daily job).
8. **Let staff search invoices** (`GET /invoices`). A single shipment's invoice and its payment history are `GET /shipments/:id/invoice`. Counter collection is `POST /shipments/:id/payments`. See `BILLING_ENDPOINTS_REPORT.md`.

Billing still does not price shipments, hold customer wallets, or talk to payment gateways. Refunds are a ledger row (`REFUNDED`) issued only on pending-shipment cancel.

---

## Problems solved

### 1. Payments did not update invoice status

**Problem.** `recordPayment` wrote the payment with Prisma (inside the transaction) then summed completed payments with Kysely. Kysely uses a separate connection pool, so it could not see the uncommitted row. The sum came back as 0, status was left `UNPAID`, and the payment still committed.

**Fix.** Load the invoice, sum payments, and update status through `InvoiceCommandRepository` / `TransactionalPrismaService` — the same Prisma transaction. After insert, the new total is `paidSoFar + amount`. The invoice `version` is bumped on every payment, even when status does not change, so two overlapping partial payments cannot both commit.

### 2. Overpayment was allowed

**Problem.** `assertAcceptsPayment` only rejected `PAID` / `CANCELLED`. A 1000 invoice could take 1200. Combined with (1), a second collection at delivery could succeed because status never became `PAID`.

**Fix.** The aggregate now takes `(amount, paidSoFar)` and refuses anything above the remaining balance. `applyPaidTotal` also throws if the collected total would exceed the invoice total.

### 3. No minimum payment

**Problem.** Any amount ≥ 0.01 was accepted.

**Fix.** Minimum is 1000 `SY` or 100 `USD`. If the remaining balance is smaller than that minimum, the only legal payment is exactly the remainder. That is the only way “no overpayment” and “minimum payment” can both hold on the last collection.

### 4. Parcel could be delivered while the invoice was unpaid

**Problem.** Proof of delivery recorded payment *after* marking the parcel collected, and did not require the invoice to be paid at all.

**Fix.** Billing is the first gate after the parcel is collectable, before photos, files, or the proof row:

1. If the request includes a payment, record it against the shipment invoice (same transaction).
2. Call `BillingFacade.assertSettledForDelivery`. Delivery is refused unless the invoice is `PAID`.

A receiver-paid shipment can therefore settle and hand over in one request. A sender-paid shipment must already be paid (counter `POST /shipments/:id/payments`) or the handover is rejected.

### 5. Cancelling a partially paid invoice dropped the money

**Problem.** Only `PAID` was blocked. `PARTIALLY_PAID` (and overdue invoices that already had payments) could be flipped to `CANCELLED` while payment rows stayed.

**Fix.** Cancel reads the completed-payment total on the Prisma connection and refuses if anything has been collected. `PARTIALLY_PAID → CANCELLED` is no longer an allowed transition.

### 6. Two invoices could exist for one shipment

**Problem.** Uniqueness was an application check via Kysely, then a Prisma insert. No unique constraint on `customer_shipment_id`. Two concurrent creates could both succeed.

**Fix.** Existence is checked on the Prisma connection inside the shipment transaction. The database now has `uq_invoice_shipment`. A `P2002` on insert is returned as a conflict. The migration keeps the oldest invoice if duplicates already exist.

### 7. Sender-phone filter could never match

**Problem.** After invoices moved from `customer_profile_id` to copied name/phone, `senderPhone` was still validated with `@IsUUID()`. A phone number was rejected; a UUID would never match `sender_phone`.

**Fix.** `senderPhone` is a string, max length 50.

### 8. Currency was an unconstrained string with three different defaults

**Problem.** Invoice column defaulted to `USD`, tenant pricing to `SR`, billing fallback to `SYP`. Quotations used `SR`. None of these were a closed set.

**Fix.** Prisma enum `Currency { SY USD }` on `invoice.currency` and `tenant_pricing_settings.default_currency`. Default is `SY`. `resolveCurrency()` maps `USD`/`US` → `USD` and everything else (including `SYP`, `SR`, `SAR`) → `SY`. Tenant pricing updates only accept the enum. Quotations use the same helper.

### 9. Concurrent partial payments could overpay when status did not change

**Problem.** Optimistic locking only ran when status changed. Two counters on a `PARTIALLY_PAID` invoice could both insert payments if the result was still `PARTIALLY_PAID`.

**Fix.** Every successful payment updates the row (status + `version + 1`). The second writer hits “Invoice was modified by another process. Please retry.” and rolls back, including its payment.

### 10. Refunds

**Rule.** A refund is a `REFUNDED` payment row for the completed total, then the invoice is cancelled. It runs only when the shipment is still **PENDING** (cancelled before work started). **RETURNED** never refunds and never voids the invoice — a return is logistics, not a cash-back. Any other status with money already taken refuses cancel.

**Where.** `cancelShipment` passes the status from *before* the cancel write. The return recalculator does not call billing.

---

## Files touched (main)

| Area | What changed |
|---|---|
| `prisma/schema.prisma` + migration `20260815220000_billing_currency_payments_and_uniqueness` | `Currency` enum, unique invoice per shipment |
| `billing/constants/billing.constants.ts` | Min amounts, `resolveCurrency`, `roundMoney` |
| `invoice.entity.ts` | No overpay, min payment, cancel with paid total |
| `invoice.command.repository.ts` | Prisma load/sum/exists; unique-constraint conflict |
| `invoice.command.service.ts` | Write-path no longer uses Kysely; `assertSettledForDelivery` |
| `billing.facade.ts` | `recordPaymentForShipment`, `assertSettledForDelivery` |
| `proof-of-delivery.command.service.ts` | Pay (optional) then require paid invoice before handover |
| Tenant pricing DTOs / entity / seeder | `Currency` enum |
| Invoice list DTO | Phone filter is a phone string |
| Unit tests | Cover min, overpay, cancel-with-payments, delivery gate |

Apply the migration before running against a database:

```bash
npx prisma migrate deploy
```
