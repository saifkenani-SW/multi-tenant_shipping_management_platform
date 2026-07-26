# Business Rules

## BR-01: Tenant Data Isolation
- Each tenant's data must be completely isolated
- Cross-tenant data access is strictly prohibited

## BR-02: Shipment Lifecycle
- Shipment must go through defined states only
- No state can be skipped without explicit override

## BR-03: Payment Rules
- All financial transactions must be double-entry
- Ledger must balance at all times

## BR-04: Rate Calculation
- Rates based on weight, distance, and shipment type
- Fuel surcharge applied dynamically

## BR-05: Role-Based Access
- Users can only access resources within their permission scope
- Tenant Admins cannot access other tenant's data
