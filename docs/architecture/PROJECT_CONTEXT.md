# Project Context

## 1. Project Overview

Multi-Tenant Shipping Management Platform is an enterprise Software-as-a-Service (SaaS) platform that enables multiple independent shipping companies (Tenants) to operate on a shared infrastructure while maintaining complete logical data isolation.

The platform is not a shipping company.

Instead, it provides the infrastructure required for shipping companies to manage customers, shipments, logistics operations, transportation, billing, notifications, and proof of delivery.

Each shipping company operates independently without visibility into any other company's data.

The platform follows Domain-Driven Design (DDD), Clean Architecture, and Modular Monolith architecture.

---

# 2. Vision

Build a scalable, secure, and maintainable logistics platform capable of serving multiple shipping companies from a single deployment while preserving complete tenant isolation and business flexibility.

The platform must support future expansion without requiring architectural redesign.

---

# 3. Business Goals

The platform aims to provide:

- Multi-Tenant SaaS architecture.
- Independent shipping companies.
- Shipment marketplace.
- Shipment quotation system.
- Complete parcel lifecycle management.
- Logistics operation management.
- Transportation management.
- Proof of Delivery (POD).
- Billing and payment management.
- Notifications.
- Customer support.
- Audit logging.
- Reporting and analytics.

---

# 4. Project Scope

The platform provides:

- Tenant onboarding.
- Organization management.
- Employee management.
- Customer management.
- Shipment request management.
- Quotation management.
- Customer shipment management.
- Parcel management.
- Transportation management.
- Logistics operations.
- Delivery management.
- Proof of Delivery.
- Billing.
- Notifications.
- Reporting.
- Audit logging.

The platform does NOT provide:

- Vehicle GPS tracking.
- Fleet optimization.
- Route optimization.
- Warehouse automation.
- Inventory management.
- ERP functionality.

These may be implemented in future releases.

---

# 5. Business Actors

## Platform Owner

Responsible for managing the SaaS platform.

Responsibilities:

- Register shipping companies.
- Manage subscriptions.
- Manage platform administrators.
- Suspend tenants.
- View platform analytics.

---

## Tenant Administrator

Responsible for managing one shipping company.

Responsibilities:

- Manage organization units.
- Manage employees.
- Manage roles.
- Configure tenant settings.
- Monitor operations.

---

## Employee

Responsible for executing daily logistics operations.

Responsibilities:

- Create shipment requests.
- Approve shipment requests.
- Register parcels.
- Receive parcels.
- Dispatch parcels.
- Scan parcels.
- Manage trips.
- Create manifests.
- Complete delivery.

Available operations depend on assigned permissions.

---

## Driver

Responsible for transportation.

Responsibilities:

- Accept assigned trips.
- Transport manifests.
- Deliver manifests.
- Complete trips.

Drivers are employees with transportation permissions.

---

## Customer

Represents the sender or receiver of shipments.

Responsibilities:

- Create shipment requests.
- View quotations.
- Select shipping company.
- Track shipments.
- Receive parcels.
- Verify delivery.

Customers maintain one global profile that may interact with multiple tenants.

---

# 6. Core Business Flow

The primary business workflow is:

Shipment Request

↓

Quotations Generated

↓

Customer Selects Quotation

↓

Company Reviews Request

↓

Request Approved

↓

Customer Shipment Created

↓

Parcels Created

↓

Transport Trip

↓

Parcel Delivery

↓

Proof Of Delivery

↓

Invoice Completion

Every business operation revolves around this workflow.

---

# 7. Core Business Concepts

The platform is centered around the following concepts:

Tenant

Organization Unit

Employee

Customer

Shipment Request

Quotation

Customer Shipment

Parcel

Transport Trip

Manifest

Proof Of Delivery

Invoice

Notification

Support Ticket

Audit Log

---

# 8. Bounded Contexts

The system is divided into the following bounded contexts.

## Platform

Platform administration.

## IAM

Authentication.

Authorization.

Roles.

Permissions.

Scopes.

## Organization

Regions.

Branches.

Warehouses.

Hubs.

Employees.

## Marketplace

Shipment Requests.

Quotations.

Customer selection.

## Shipping

Customer Shipments.

Parcels.

Tracking.

## Transport

Trips.

Vehicles.

Drivers.

Manifests.

## Delivery

Delivery operations.

Proof of Delivery.

## Billing

Invoices.

Payments.

COD.

## Notification

SMS.

Email.

Push notifications.

## Support

Customer support.

Tickets.

## Audit

Business audit logs.

Activity logs.

---

# 9. Core Domain

The Core Domain of the platform is:

Parcel Logistics Management.

All other modules exist to support the parcel lifecycle.

The Parcel is the primary business asset of the platform.

---

# 10. Design Principles

The project follows the following principles:

- Domain-Driven Design.
- Clean Architecture.
- Modular Monolith.
- API First.
- Multi-Tenant First.
- Security by Design.
- Business Rules belong to the Domain.
- Infrastructure depends on the Domain.
- High Cohesion.
- Low Coupling.

---

# 11. Tenant Isolation

Tenant isolation is mandatory.

Every business operation must execute within the authenticated tenant context.

No business operation may expose another tenant's data.

Cross-tenant access is prohibited unless explicitly implemented as a platform-level administrative capability.

---

# 12. Source of Truth

Business rules are defined by:

1. SRS
2. State Machines
3. Domain Invariants

If implementation conflicts with these documents, the implementation is considered incorrect.

---

# 13. Project Philosophy

The architecture prioritizes:

- Correctness over speed.
- Maintainability over shortcuts.
- Explicitness over hidden behavior.
- Business consistency over framework convenience.
- Long-term scalability over short-term optimization.

The project is designed as an enterprise-grade logistics platform rather than a simple CRUD application.