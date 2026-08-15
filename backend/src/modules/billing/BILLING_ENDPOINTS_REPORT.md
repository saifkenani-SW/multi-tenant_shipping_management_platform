# Billing endpoints and payment-history report

What changed after the shipment-owned billing URLs were implemented: routes, the delivery gate, how payment history survives a refund, and the conflicts that were resolved so those pieces do not fight each other.

---

## Why the invoice is reached through the shipment

An invoice is not an independent resource. There is exactly one per shipment (`uq_invoice_shipment`), it is created in the same transaction as the shipment, and whoever may see the shipment may see its money. Authorising the invoice a second time (a billing CASL module, `GET /invoices/:id`, `POST /invoices/:id/payments`) duplicated rules and invited the two modules to disagree.

So:

| Act | Endpoint | Who |
|---|---|---|
| Create shipment + invoice | `POST /shipments` | Employee with create-shipment |
| Invoice + **full payment history** | `GET /shipments/:id/invoice` | Anyone who may view that shipment (including the customer) |
| Counter payment | `POST /shipments/:id/payments` | Tenant admin (own tenant) or employee with `MANAGE_BILLING` at origin **or** destination |
| Cancel + pending refund | `POST /shipments/:id/cancel` | Already existed. Billing runs inside this call |
| COD / handover | `POST /parcels/:trackingNumber/proof-of-delivery` | Already existed. Optional payment on the same request; delivery refused until `PAID` |
| Search many invoices | `GET /invoices` | Staff only. No single shipment to start from |

Removed (they conflicted with the shipment routes):

- `GET /invoices/:id`
- `POST /invoices/:id/payments`

`GET /invoices` stays. It is a search, not a substitute for history. Filter by `customerShipmentId` if needed; the payments array is only on `GET /shipments/:id/invoice`.

---

## Payment history: append-only ledger

The requirement is: pay, then cancel while pending, then still see **every** collection and the refund.

### Decision

Do **not** edit or delete payment rows. Do **not** subtract refunds from `paidAmount`. Do **not** issue a second invoice.

A payment row is an event:

- Collection → `COMPLETED`
- Pending-shipment cancel with money held → one extra `REFUNDED` row for the **sum of completed amounts**, then the invoice becomes `CANCELLED`

That is the only design that keeps history without rewriting the past or colliding with uniqueness.

### What `GET /shipments/:id/invoice` returns after pay → cancel → refund

```
status:          CANCELLED
paidAmount:      5000        // sum of COMPLETED (never reduced)
refundedAmount:  5000        // sum of REFUNDED
balanceDue:      0           // cancelled invoices owe nothing
payments: [
  { amount: 2000, status: COMPLETED, createdAt: ... },
  { amount: 3000, status: COMPLETED, createdAt: ... },
  { amount: 5000, status: REFUNDED,  transactionReference: "REFUND:PREFIX-INV-YYYY-NNNNN" }
]
```

`payments` is every row for that invoice, oldest first. Nothing is filtered out.

### Why not the alternatives

| Alternative | Why it was rejected |
|---|---|
| Flip the original row to `REFUNDED` | Loses the collection. You can no longer see that money was taken. |
| Delete payments on cancel | Same loss, and breaks audit. |
| Reduce `paidAmount` by refunds | `paidAmount` would lie about what was collected. Two numbers (`paidAmount` + `refundedAmount`) stay honest. |
| New invoice after refund | Breaks `one invoice per shipment`. `GET /shipments/:id/invoice` would not know which row to return. |
| Store history in a separate table | Extra model for the same events already in `payment`. |

The cancelled invoice **is** the invoice for that shipment. `GET /shipments/:id/invoice` always returns it, including after refund.

---

## Proof of delivery does not complete until the invoice is paid

`POST /parcels/:trackingNumber/proof-of-delivery` is still the handover URL. Billing is not a second endpoint on that path.

Order inside the same transaction:

1. Parcel must be collectable and must not already have a proof row.
2. If the request body includes `payment`, record it against the shipment invoice.
3. `assertSettledForDelivery` — invoice must be `PAID`. Unpaid, partial, overdue, cancelled, or missing invoice → conflict, **no proof, no files, no status change**.
4. Tenant photo/signature checks, file uploads, proof row, parcel `COLLECTED`, tracking, shipment recalculation.

A short payment or an unpaid invoice rolls the whole handover back.

COD: attach `payment` on the POD request so settle and deliver are one act.

Already paid at the counter: omit `payment`; the gate still runs.

Do **not** also call `POST /shipments/:id/payments` in the same handover. Two collections would fight the no-overpay rule. Counter pay is for sender-paid / branch collection **before** delivery.

A cancelled-and-refunded invoice is not `PAID`, so POD cannot complete after a pending cancel.

---

## Cancel and refund (unchanged rule, now visible in history)

`POST /shipments/:id/cancel` already called billing. It still does.

- Status used for the refund decision is the shipment status **before** the cancel write.
- Unpaid → invoice `CANCELLED`, no payment row.
- Money collected + shipment still `PENDING` → append `REFUNDED` for the completed total, then cancel the invoice.
- Money collected + any later status → refuse cancel (keep the money).
- `RETURNED` never comes through this path and never refunds.

After a successful pending cancel, `GET /shipments/:id/invoice` is how you see that a payment happened and was refunded.

---

## Authorization (no second billing CASL module)

Shipment policy loads the shipment, then CASL decides.

| Role | View invoice | Record payment | Cancel |
|---|---|---|---|
| Customer | Own sender/receiver phone | No | No |
| Employee | `READ_SHIPMENT` at origin or destination | `MANAGE_BILLING` at origin or destination | `CANCEL_SHIPMENT` at origin, PENDING/PROCESSING |
| Tenant admin | Own tenant | Own tenant | Own tenant, PENDING/PROCESSING |
| Platform owner | View only | No | No |

`ShipmentAction.RecordPayment` was added so tenant-admin cancel/pay is not denied by CASL after the `@Roles` guard already allowed it. Shipment details now expose `canRecordPayment`.

Billing facade methods assume the caller already authorised the shipment. Listing `GET /invoices` still applies tenant + assigned-branch scope itself, because there is no shipment in the URL.

---

## Conflicts resolved

1. **Two ways to pay the same invoice.** Counter pay is shipment-scoped. POD pay is optional on handover. Both go through `recordPaymentForShipment` and the same no-overpay / min-amount / version bump rules. The old `POST /invoices/:id/payments` is gone so clients cannot bypass shipment auth.
2. **Two ways to read one invoice.** `GET /invoices/:id` removed. History lives on `GET /shipments/:id/invoice`. `GET /invoices` is search-only (no `payments` array).
3. **Refund vs uniqueness.** Refund does not create a second invoice and does not delete the first. The cancelled invoice remains the one row for that shipment.
4. **Refund vs `paidAmount`.** Completed sums and refunded sums are separate columns. List queries use the same split (`paid_amount` / `refunded_amount` subqueries). `balanceDue` is 0 when status is `CANCELLED`.
5. **POD vs unpaid invoice.** Delivery is gated **before** files and the proof row. Optional COD payment is in the same transaction as the gate.
6. **POD vs counter pay.** Same ledger, same invoice. Paying twice beyond the remainder is refused.
7. **Tenant admin vs CASL.** Admin can view, pay, and cancel (PENDING/PROCESSING) in their tenant. Previously `@Roles` allowed cancel while CASL denied it.
8. **Customer vs pay.** Customers can see history; they cannot record a payment.
9. **Docs.** `BILLING_FIX_REPORT.md` still describes the earlier money-rule fixes; its old invoice URLs were updated to these shipment URLs so the two reports agree.

---

## Files touched

| File | Change |
|---|---|
| `shipment.controller.ts` | `GET :id/invoice`, `POST :id/payments` |
| `shipment.query.service.ts` / `shipment.command.service.ts` | Delegate to `BillingFacade` after shipment `@Authorize` |
| `record-shipment-payment.dto.ts` | Counter-payment body |
| `shipment.action.ts` / `shipment.ability.ts` / `shipment.policy.ts` | `RecordPayment`; tenant-admin pay/cancel |
| `shipment.capabilities.interface.ts` / builder | `canRecordPayment` |
| `invoice.controller.ts` | `GET /invoices` only |
| `invoice.query.repository.ts` | `refunded_amount` subquery; payments unfiltered |
| `invoice.mapper.ts` / response DTOs | `refundedAmount`; history includes `REFUNDED` |
| `invoice.query.service.ts` | `findByShipmentId` (no extra auth) |
| `billing.facade.ts` | `getInvoiceForShipment` |
| `proof-of-delivery.command.service.ts` | Pay + settle gate before photos/files/proof |
| Unit tests | Refund append, shipment lookup, cancelled delivery, mapper history |

No new Prisma migration. Payment history uses the existing `payment` table and `PaymentStatus.REFUNDED`.
