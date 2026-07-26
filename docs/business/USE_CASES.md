# Use Cases

## Use Case Diagram
[Diagram to be added]

## Use Cases List

### UC-01: Tenant Registration
- **Actor:** System Admin
- **Precondition:** Admin is authenticated
- **Postcondition:** New tenant created with default configurations

### UC-02: Shipment Creation
- **Actor:** Dispatcher
- **Precondition:** Dispatcher is authenticated
- **Postcondition:** Shipment created and available for assignment

### UC-03: Driver Assignment
- **Actor:** Dispatcher
- **Precondition:** Shipment exists, driver is available
- **Postcondition:** Driver assigned to shipment

### UC-04: Shipment Tracking
- **Actor:** Customer
- **Precondition:** Shipment exists
- **Postcondition:** Real-time location displayed
