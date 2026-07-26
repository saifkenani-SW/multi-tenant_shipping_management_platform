# Domain Invariants

## Purpose

This document defines the business invariants of the platform.

An invariant is a business rule that must always remain true.

Aggregates are responsible for protecting their own invariants.

Application Services may coordinate operations but must never bypass these rules.

If an invariant is violated, the Aggregate must reject the operation by raising a Domain Exception.

---

# General Invariants

## Tenant Isolation

Every business entity belongs to exactly one tenant.

No business operation may access data belonging to another tenant.

Cross-tenant operations are prohibited unless explicitly performed by the Platform Owner.

---

## Aggregate Integrity

Aggregates protect their own consistency.

External objects may never modify aggregate state directly.

All modifications must pass through aggregate behavior.

---

## Tracking Number

Tracking numbers are globally unique.

No two parcels may share the same tracking number.

---

## Shipment Request

A Shipment Request:

- belongs to exactly one customer.
- belongs to exactly one tenant after quotation approval.
- may have multiple quotations.
- may have only one approved quotation.
- may be converted into exactly one Customer Shipment.
- cannot be converted more than once.
- cannot be cancelled after conversion.
- cannot expire after conversion.

---

## Quotation

Every quotation:

- belongs to one Shipment Request.
- belongs to one tenant.
- contains a pricing snapshot.
- becomes immutable after approval.

Exactly one quotation may be approved.

Approving one quotation automatically rejects all remaining quotations.

---

## Customer Shipment

A Customer Shipment:

- originates from exactly one approved Shipment Request.
- belongs to exactly one customer.
- belongs to exactly one tenant.
- contains one or more parcels.
- cannot exist before Shipment Request approval.
- cannot be deleted after parcel creation.

---

## Parcel

Every Parcel:

- belongs to exactly one Customer Shipment.
- belongs to exactly one tenant.
- owns exactly one tracking number.
- owns exactly one current status.
- owns exactly one current condition.
- may belong to only one active Manifest at a time.
- may belong to only one active Trip at a time.
- cannot be collected before becoming Ready For Collection.
- cannot move after being Cancelled.
- cannot be delivered twice.
- cannot own more than one Proof Of Delivery.

---

## Parcel Condition

Parcel Condition is independent from Parcel Status.

Changing the condition must never modify the parcel lifecycle.

Condition changes must be recorded in Parcel Movement history.

---

## Trip

Every Trip:

- has exactly one origin.
- has exactly one destination.
- has exactly one assigned driver.
- may contain multiple manifests.
- cannot start without at least one manifest.
- cannot start twice.
- cannot be completed before departure.
- cannot be cancelled after departure unless tenant policy explicitly allows it.

---

## Manifest

Every Manifest:

- belongs to exactly one Trip.
- belongs to exactly one tenant.
- contains one origin.
- contains one destination.
- may contain multiple parcels.
- may not contain duplicate parcels.
- cannot load parcels after Trip departure.
- cannot be modified after completion.

---

## Organization Unit

Every Organization Unit:

- belongs to one tenant.
- belongs to one region.
- has one type.
- cannot become its own parent.
- cannot create cyclic hierarchy.

---

## Customer

Every Customer:

- owns exactly one global profile.
- may interact with multiple tenants.
- may have different business relationships with different tenants.

---

## Employee

Every Employee:

- belongs to one tenant.
- belongs to one user account.
- may have multiple scoped assignments.
- permissions are determined by assigned roles and scopes.

---

## Proof Of Delivery

Every Proof Of Delivery:

- belongs to exactly one Parcel.
- may be created only once.
- may only be created after parcel collection.
- stores delivery verification evidence.
- becomes immutable after successful verification.

Delivery verification evidence may include:

- OTP
- Electronic Signature
- Proof Photo
- Identity Document
- GPS Location

Required evidence depends on Tenant Settings.

---

## Invoice

Every Invoice:

- belongs to one Customer Shipment.
- belongs to one tenant.
- has one payment responsibility.
- may only be marked as Paid once.
- becomes immutable after payment.

---

## Payment

Payments:

- always belong to one invoice.
- cannot exceed invoice amount.
- cannot be duplicated.
- must preserve payment history.

---

## Support Ticket

Every Support Ticket:

- belongs to one tenant.
- has one creator.
- maintains immutable activity history.
- cannot be reopened after closure unless tenant policy allows it.

---

## Audit Log

Audit records:

- are immutable.
- are append-only.
- cannot be updated.
- cannot be deleted.
- always preserve actor identity.
- always preserve timestamp.

---

## Tenant Settings

Tenant Settings define configurable business behavior.

Business logic must always respect tenant configuration.

Examples include:

- Delivery verification requirements.
- Trip cancellation policy.
- Shipment reopening policy.
- Return policy.
- Notification preferences.
- Pricing configuration.

Tenant settings must never violate core business invariants.

---

# Architecture Rule

Whenever a business rule appears to conflict with this document:

The Domain Model is considered incorrect.

The implementation must be changed.

The business invariant must never be bypassed.

---

# Final Principle

State Machines define **what may happen**.

Domain Invariants define **when it is allowed to happen**.

Both documents are mandatory.

Neither document overrides the other.