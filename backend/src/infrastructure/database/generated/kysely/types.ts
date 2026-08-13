import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export const RequestStatus = {
    PENDING: "PENDING",
    CUSTOMER_APPROVED: "CUSTOMER_APPROVED",
    COMPANY_ACCEPTED: "COMPANY_ACCEPTED",
    REJECTED: "REJECTED",
    CONVERTED: "CONVERTED",
    CANCELLED: "CANCELLED",
    EXPIRED: "EXPIRED"
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];
export const ParcelStatus = {
    PROCESSING: "PROCESSING",
    READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
    IN_TRANSIT: "IN_TRANSIT",
    READY_FOR_COLLECTION: "READY_FOR_COLLECTION",
    COLLECTED: "COLLECTED",
    RETURNED: "RETURNED",
    CANCELLED: "CANCELLED"
} as const;
export type ParcelStatus = (typeof ParcelStatus)[keyof typeof ParcelStatus];
export const ParcelCondition = {
    NORMAL: "NORMAL",
    DAMAGED: "DAMAGED",
    OPENED: "OPENED",
    LOST: "LOST",
    DESTROYED: "DESTROYED"
} as const;
export type ParcelCondition = (typeof ParcelCondition)[keyof typeof ParcelCondition];
export const ShipmentStatus = {
    PENDING: "PENDING",
    PROCESSING: "PROCESSING",
    READY_FOR_DISPATCH: "READY_FOR_DISPATCH",
    IN_TRANSIT: "IN_TRANSIT",
    READY_FOR_COLLECTION: "READY_FOR_COLLECTION",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    RETURNED: "RETURNED"
} as const;
export type ShipmentStatus = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];
export const TripStatus = {
    SCHEDULED: "SCHEDULED",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED"
} as const;
export type TripStatus = (typeof TripStatus)[keyof typeof TripStatus];
export const ManifestStatus = {
    PENDING: "PENDING",
    IN_TRANSIT: "IN_TRANSIT",
    COMPLETED: "COMPLETED"
} as const;
export type ManifestStatus = (typeof ManifestStatus)[keyof typeof ManifestStatus];
export const ManifestItemStatus = {
    PENDING_LOAD: "PENDING_LOAD",
    LOADED: "LOADED",
    UNLOADED: "UNLOADED",
    MISSING: "MISSING"
} as const;
export type ManifestItemStatus = (typeof ManifestItemStatus)[keyof typeof ManifestItemStatus];
export const QuotationType = {
    AUTOMATIC: "AUTOMATIC",
    MANUAL: "MANUAL"
} as const;
export type QuotationType = (typeof QuotationType)[keyof typeof QuotationType];
export const QuotationStatus = {
    WAITING_PRICING_REQUEST: "WAITING_PRICING_REQUEST",
    WAITING_PRICING: "WAITING_PRICING",
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    EXPIRED: "EXPIRED",
    WITHDRAWN: "WITHDRAWN"
} as const;
export type QuotationStatus = (typeof QuotationStatus)[keyof typeof QuotationStatus];
export const PaymentMethod = {
    CASH: "CASH",
    ONLINE: "ONLINE",
    BANK_TRANSFER: "BANK_TRANSFER"
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const PaymentStatus = {
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    FAILED: "FAILED",
    REFUNDED: "REFUNDED"
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const NotificationChannel = {
    PUSH: "PUSH",
    SMS: "SMS",
    EMAIL: "EMAIL",
    IN_APP: "IN_APP"
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];
export const NotificationStatus = {
    PENDING: "PENDING",
    SENT: "SENT",
    DELIVERED: "DELIVERED",
    FAILED: "FAILED"
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
export const TicketCategory = {
    GENERAL: "GENERAL",
    PARCEL_ISSUE: "PARCEL_ISSUE",
    PAYMENT: "PAYMENT",
    DELIVERY: "DELIVERY",
    OTHER: "OTHER"
} as const;
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];
export const TicketPriority = {
    LOW: "LOW",
    MEDIUM: "MEDIUM",
    HIGH: "HIGH",
    URGENT: "URGENT"
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];
export const TicketStatus = {
    OPEN: "OPEN",
    IN_PROGRESS: "IN_PROGRESS",
    WAITING_CUSTOMER: "WAITING_CUSTOMER",
    RESOLVED: "RESOLVED",
    CLOSED: "CLOSED"
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];
export const InvoiceStatus = {
    UNPAID: "UNPAID",
    PARTIALLY_PAID: "PARTIALLY_PAID",
    PAID: "PAID",
    CANCELLED: "CANCELLED",
    OVERDUE: "OVERDUE"
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
export const SubscriptionStatus = {
    ACTIVE: "ACTIVE",
    EXPIRED: "EXPIRED",
    CANCELLED: "CANCELLED",
    SUSPENDED: "SUSPENDED",
    TRIAL: "TRIAL"
} as const;
export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus];
export const VehicleStatus = {
    ACTIVE: "ACTIVE",
    MAINTENANCE: "MAINTENANCE",
    INACTIVE: "INACTIVE"
} as const;
export type VehicleStatus = (typeof VehicleStatus)[keyof typeof VehicleStatus];
export const PlatformRole = {
    SUPER_ADMIN: "SUPER_ADMIN",
    SUPPORT: "SUPPORT",
    BILLING_ADMIN: "BILLING_ADMIN"
} as const;
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];
export const OrgType = {
    REGION: "REGION",
    HUB: "HUB",
    WAREHOUSE: "WAREHOUSE",
    BRANCH: "BRANCH",
    LOCKER: "LOCKER"
} as const;
export type OrgType = (typeof OrgType)[keyof typeof OrgType];
export const LocationType = {
    COUNTRY: "COUNTRY",
    GOVERNORATE: "GOVERNORATE",
    CITY: "CITY",
    DISTRICT: "DISTRICT",
    AREA: "AREA"
} as const;
export type LocationType = (typeof LocationType)[keyof typeof LocationType];
export const ActionType = {
    RECEIVED_AT_BRANCH: "RECEIVED_AT_BRANCH",
    LOADED_ON_TRIP: "LOADED_ON_TRIP",
    TRIP_DEPARTED: "TRIP_DEPARTED",
    ARRIVED_AT_FACILITY: "ARRIVED_AT_FACILITY",
    READY_FOR_COLLECTION: "READY_FOR_COLLECTION",
    COLLECTED: "COLLECTED",
    RETURN_COMPLETED: "RETURN_COMPLETED",
    CANCELLED: "CANCELLED",
    CONDITION_UPDATED: "CONDITION_UPDATED",
    POD_COMPLETED: "POD_COMPLETED",
    CREATED: "CREATED",
    TRANSFERRED: "TRANSFERRED"
} as const;
export type ActionType = (typeof ActionType)[keyof typeof ActionType];
export const NotificationType = {
    QUOTATION: "QUOTATION",
    OTP: "OTP",
    SHIPMENT: "SHIPMENT",
    PARCEL: "PARCEL",
    PAYMENT: "PAYMENT",
    SYSTEM: "SYSTEM",
    PROMOTION: "PROMOTION"
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];
export const PaymentResponsibility = {
    SENDER: "SENDER",
    RECEIVER: "RECEIVER"
} as const;
export type PaymentResponsibility = (typeof PaymentResponsibility)[keyof typeof PaymentResponsibility];
export const VehicleType = {
    Bike: "Bike",
    Car: "Car",
    Van: "Van",
    Truck: "Truck"
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];
export const CollectionMethod = {
    CUSTOMER: "CUSTOMER",
    REPRESENTATIVE: "REPRESENTATIVE"
} as const;
export type CollectionMethod = (typeof CollectionMethod)[keyof typeof CollectionMethod];
export const ParcelType = {
    DOCUMENT: "DOCUMENT",
    PACKAGE: "PACKAGE",
    FRAGILE: "FRAGILE",
    PERISHABLE: "PERISHABLE",
    HAZARDOUS: "HAZARDOUS",
    LIQUID: "LIQUID"
} as const;
export type ParcelType = (typeof ParcelType)[keyof typeof ParcelType];
export const HandlingFeeType = {
    FRAGILE: "FRAGILE",
    HAZARDOUS: "HAZARDOUS",
    PERISHABLE: "PERISHABLE",
    TEMPERATURE_SENSITIVE: "TEMPERATURE_SENSITIVE"
} as const;
export type HandlingFeeType = (typeof HandlingFeeType)[keyof typeof HandlingFeeType];
export const CoverageType = {
    DELIVERY_AREA: "DELIVERY_AREA",
    PICKUP_AREA: "PICKUP_AREA",
    BOTH: "BOTH"
} as const;
export type CoverageType = (typeof CoverageType)[keyof typeof CoverageType];
export const ServiceLevel = {
    STANDARD: "STANDARD",
    EXPRESS: "EXPRESS",
    SAME_DAY: "SAME_DAY",
    REFRIGERATED: "REFRIGERATED"
} as const;
export type ServiceLevel = (typeof ServiceLevel)[keyof typeof ServiceLevel];
export type assignment_role = {
    id: string;
    assignment_id: string;
    role_id: string;
    granted_at: Generated<Timestamp>;
};
export type audit_log = {
    id: string;
    tenant_id: string | null;
    actor_user_id: string | null;
    actor_ip: string | null;
    actor_user_agent: string | null;
    event_type: string;
    entity_type: string | null;
    entity_id: string | null;
    old_values: unknown | null;
    new_values: unknown | null;
    metadata: unknown | null;
    created_at: Generated<Timestamp>;
};
export type customer_address = {
    id: string;
    customer_id: string;
    label: string | null;
    address_line: string;
    is_default: Generated<boolean>;
    created_at: Generated<Timestamp>;
};
export type customer_profile = {
    id: string;
    user_id: string;
    full_name: string;
    phone: string;
    profile_image_key: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type customer_shipment = {
    id: string;
    version: Generated<number>;
    tenant_id: string;
    sender_national_id: string | null;
    sender_name: string;
    sender_phone: string;
    sender_customer_profile_id: string;
    receiver_customer_profile_id: string | null;
    shipment_request_id: string | null;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    service_level: Generated<ServiceLevel>;
    receiver_name: string;
    receiver_phone: string;
    payment_responsibility: Generated<PaymentResponsibility>;
    total_chargeable_weight_kg: Generated<string | null>;
    status: Generated<ShipmentStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
    created_by_employee_id: string | null;
    created_by_employee_name: string | null;
};
export type customer_tenant = {
    id: string;
    tenant_id: string;
    customer_profile_id: string;
    first_interaction_at: Generated<Timestamp>;
};
export type employee = {
    id: string;
    tenant_id: string;
    user_id: string;
    employee_code: string;
    national_id: string | null;
    full_name: string;
    is_active: Generated<boolean>;
    deactivated_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type employee_assignment = {
    id: string;
    tenant_id: string;
    employee_id: string;
    organization_unit_id: string;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
};
export type global_location = {
    id: string;
    parent_id: string | null;
    name: string;
    type: LocationType;
};
export type handling_fee_rule = {
    id: string;
    tenant_id: string;
    fee_type: HandlingFeeType;
    amount: string;
    is_active: Generated<boolean>;
};
export type invoice = {
    id: string;
    version: Generated<number>;
    tenant_id: string;
    customer_profile_id: string;
    customer_shipment_id: string | null;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    invoice_number: string;
    subtotal: string;
    handling_fees: Generated<string>;
    tax_amount: Generated<string>;
    discount_amount: Generated<string>;
    total_amount: string;
    payment_responsibility: Generated<PaymentResponsibility>;
    currency: Generated<string>;
    status: Generated<InvoiceStatus>;
    due_date: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type invoice_counter = {
    tenant_id: string;
    year: number;
    last_number: Generated<number>;
    updated_at: Timestamp;
};
export type manifest_item = {
    id: string;
    manifest_id: string;
    parcel_id: string;
    status: Generated<ManifestItemStatus>;
    loaded_at: Timestamp | null;
    unloaded_at: Timestamp | null;
};
export type notification = {
    id: string;
    tenant_id: string | null;
    recipient_user_id: string;
    notification_type: NotificationType;
    title: string;
    body: string;
    data: unknown | null;
    channel: NotificationChannel;
    is_read: Generated<boolean>;
    read_at: Timestamp | null;
    sent_at: Timestamp | null;
    status: Generated<NotificationStatus>;
    created_at: Generated<Timestamp>;
};
export type org_unit_location_mapping = {
    id: string;
    tenant_id: string;
    organization_unit_id: string;
    global_location_id: string;
    coverage_type: Generated<CoverageType>;
};
export type organization_unit = {
    id: string;
    tenant_id: string;
    parent_id: string | null;
    zone_id: string | null;
    name: string;
    org_type: OrgType;
    address_line: string | null;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type parcel = {
    id: string;
    version: Generated<number>;
    tenant_id: string;
    customer_shipment_id: string;
    destination_org_unit_id: string | null;
    label_key: string | null;
    tracking_number: string;
    description: string | null;
    category: string | null;
    parcel_type: Generated<ParcelType>;
    is_fragile: Generated<boolean>;
    requires_upright_handling: Generated<boolean>;
    temperature_sensitive: Generated<boolean>;
    actual_weight_kg: string;
    length_cm: string;
    width_cm: string;
    height_cm: string;
    volumetric_weight_kg: string | null;
    current_status: Generated<ParcelStatus>;
    current_condition: Generated<ParcelCondition>;
    current_org_unit_id: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type parcel_movement = {
    id: string;
    tenant_id: string;
    parcel_id: string;
    trip_id: string | null;
    organization_unit_id: string | null;
    performed_by_employee_id: string;
    action_type: ActionType;
    previous_status: ParcelStatus | null;
    new_status: ParcelStatus;
    previous_condition: ParcelCondition | null;
    new_condition: ParcelCondition;
    organization_unit_name: string | null;
    organization_type: OrgType | null;
    organization_latitude: string | null;
    organization_longitude: string | null;
    trip_number: string | null;
    performed_by_name: string;
    metadata: unknown | null;
    notes: string | null;
    created_at: Generated<Timestamp>;
};
export type payment = {
    id: string;
    tenant_id: string;
    invoice_id: string;
    collected_by_employee_id: string | null;
    organization_unit_id: string | null;
    amount: string;
    payment_method: PaymentMethod;
    transaction_reference: string | null;
    gateway_response: unknown | null;
    status: Generated<PaymentStatus>;
    created_at: Generated<Timestamp>;
};
export type permission = {
    id: string;
    name: string;
    resource: string;
    action: string;
    description: string | null;
};
export type platform_admin = {
    id: string;
    user_id: string;
    full_name: string;
    role: Generated<PlatformRole>;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type proof_of_delivery = {
    id: string;
    tenant_id: string;
    parcel_id: string;
    delivered_by_employee_id: string;
    collection_method: Generated<CollectionMethod>;
    received_by_name: string;
    received_by_national_id: string | null;
    otp_verified: Generated<boolean>;
    otp_verified_at: Timestamp | null;
    signature_key: string | null;
    id_photo_key: string | null;
    parcel_photo_key: string | null;
    additional_photo_key: string | null;
    delivery_lat: string | null;
    delivery_lng: string | null;
    created_at: Generated<Timestamp>;
};
export type quotation = {
    id: string;
    tenant_id: string;
    shipment_request_id: string;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    service_level: Generated<ServiceLevel>;
    quotation_type: Generated<QuotationType>;
    base_price: string | null;
    weight_charge: string | null;
    extra_fees: Generated<string | null>;
    amount: string;
    pricing_snapshot: unknown | null;
    notes: string | null;
    valid_until: Timestamp | null;
    status: Generated<QuotationStatus>;
    submitted_by_employee_id: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type role = {
    id: string;
    tenant_id: string;
    name: string;
    description: string | null;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
};
export type role_permission = {
    id: string;
    role_id: string;
    permission_id: string;
};
export type shipment_request = {
    id: string;
    customer_profile_id: string;
    target_tenant_id: string | null;
    origin_global_location_id: string;
    destination_global_location_id: string;
    sender_name: string;
    sender_phone: string;
    sender_lat: string | null;
    sender_lng: string | null;
    receiver_name: string;
    receiver_phone: string;
    receiver_lat: string | null;
    receiver_lng: string | null;
    expected_pieces_count: Generated<number>;
    expected_total_weight_kg: string;
    expected_length_cm: Generated<string>;
    expected_width_cm: Generated<string>;
    expected_height_cm: Generated<string>;
    notes: string | null;
    status: Generated<RequestStatus>;
    cancelled_at: Timestamp | null;
    cancellation_reason: string | null;
    expires_at: Timestamp | null;
    approved_quotation_id: string | null;
    created_by_employee_id: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type subscription_plan = {
    id: string;
    name: string;
    description: string | null;
    max_branches: Generated<number>;
    max_warehouses: Generated<number>;
    max_employees: Generated<number>;
    max_vehicles: Generated<number>;
    max_zones: Generated<number>;
    max_monthly_shipments: number | null;
    max_monthly_parcels: number | null;
    price_monthly: Generated<string>;
    price_yearly: string | null;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type support_ticket = {
    id: string;
    tenant_id: string | null;
    submitted_by_user_id: string;
    assigned_to_employee_id: string | null;
    subject: string;
    category: Generated<TicketCategory>;
    priority: Generated<TicketPriority>;
    parcel_id: string | null;
    shipment_id: string | null;
    status: Generated<TicketStatus>;
    closed_at: Timestamp | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type support_ticket_message = {
    id: string;
    ticket_id: string;
    sender_user_id: string;
    message: string;
    attachments: unknown | null;
    created_at: Generated<Timestamp>;
};
export type tenant = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    logo_url: string | null;
    tax_number: string | null;
    is_active: Generated<boolean>;
    suspended_at: Timestamp | null;
    suspended_reason: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type tenant_delivery_settings = {
    tenant_id: string;
    require_otp: Generated<boolean>;
    require_signature: Generated<boolean>;
    require_proof_photo: Generated<boolean>;
    require_id_photo: Generated<boolean>;
    allow_representative: Generated<boolean>;
};
export type tenant_operational_settings = {
    tenant_id: string;
    tracking_prefix: string | null;
    auto_close_shipment_after_collection: Generated<boolean>;
    allow_shipment_reopen: Generated<boolean>;
    allow_trip_cancellation_after_loading: Generated<boolean>;
    require_manager_before_trip_departure: Generated<boolean>;
    allow_return_after_collection: Generated<boolean>;
    require_sender_national_id: Generated<boolean>;
    quotation_validity_hours: Generated<number>;
};
export type tenant_owner = {
    id: string;
    tenant_id: string;
    user_id: string;
    is_primary: Generated<boolean>;
    created_at: Generated<Timestamp>;
};
export type tenant_pricing_settings = {
    tenant_id: string;
    volumetric_divisor: Generated<number>;
    default_currency: Generated<string>;
};
export type tenant_subscription = {
    id: string;
    tenant_id: string;
    plan_id: string;
    status: Generated<SubscriptionStatus>;
    started_at: Generated<Timestamp>;
    expires_at: Timestamp;
    cancelled_at: Timestamp | null;
    cancellation_reason: string | null;
    snapshot_max_branches: number;
    snapshot_max_warehouses: number;
    snapshot_max_employees: number;
    snapshot_max_vehicles: number;
    snapshot_max_zones: number;
    snapshot_max_monthly_shipments: number | null;
    snapshot_max_monthly_parcels: number | null;
    snapshot_features: Generated<unknown>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type tenant_subscription_history = {
    id: string;
    tenant_id: string;
    subscription_id: string;
    plan_id: string;
    action: string;
    previous_plan_id: string | null;
    notes: string | null;
    performed_by: string | null;
    performed_at: Generated<Timestamp>;
};
export type tenant_zone = {
    id: string;
    tenant_id: string;
    name: string;
    description: string | null;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
};
export type transport_manifest = {
    id: string;
    tenant_id: string;
    trip_id: string;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    status: Generated<ManifestStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type trip = {
    id: string;
    tenant_id: string;
    driver_id: string;
    vehicle_id: string | null;
    origin_org_unit_id: string;
    destination_org_unit_id: string;
    status: Generated<TripStatus>;
    scheduled_at: Timestamp | null;
    started_at: Timestamp | null;
    ended_at: Timestamp | null;
    notes: string | null;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type user_device_token = {
    id: string;
    user_id: string;
    /**
     * الـ FCM token الذي يُرسله التطبيق عند تسجيل الدخول
     */
    fcm_token: string;
    /**
     * نوع الجهاز: android / ios / web
     */
    platform: string;
    created_at: Generated<Timestamp>;
};
export type user_session = {
    id: string;
    user_id: string;
    hashed_refresh_token: string;
    device_info: string | null;
    ip_address: string | null;
    expires_at: Timestamp;
    created_at: Generated<Timestamp>;
};
export type users = {
    id: string;
    email: string;
    phone: string | null;
    password_hash: string;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type vehicle = {
    id: string;
    tenant_id: string;
    plate_number: string;
    type: VehicleType | null;
    capacity_kg: string | null;
    status: Generated<VehicleStatus>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type vehicle_assignment = {
    id: string;
    tenant_id: string;
    employee_id: string;
    vehicle_id: string;
    is_active: Generated<boolean>;
    assigned_at: Generated<Timestamp>;
    removed_at: Timestamp | null;
};
export type zone_pricing_matrix = {
    id: string;
    tenant_id: string;
    origin_zone_id: string;
    destination_zone_id: string;
    service_level: Generated<ServiceLevel>;
    base_price: string;
    base_weight_kg: string;
    price_per_extra_kg: Generated<string>;
    is_active: Generated<boolean>;
    created_at: Generated<Timestamp>;
    updated_at: Timestamp;
};
export type DB = {
    assignment_role: assignment_role;
    audit_log: audit_log;
    customer_address: customer_address;
    customer_profile: customer_profile;
    customer_shipment: customer_shipment;
    customer_tenant: customer_tenant;
    employee: employee;
    employee_assignment: employee_assignment;
    global_location: global_location;
    handling_fee_rule: handling_fee_rule;
    invoice: invoice;
    invoice_counter: invoice_counter;
    manifest_item: manifest_item;
    notification: notification;
    org_unit_location_mapping: org_unit_location_mapping;
    organization_unit: organization_unit;
    parcel: parcel;
    parcel_movement: parcel_movement;
    payment: payment;
    permission: permission;
    platform_admin: platform_admin;
    proof_of_delivery: proof_of_delivery;
    quotation: quotation;
    role: role;
    role_permission: role_permission;
    shipment_request: shipment_request;
    subscription_plan: subscription_plan;
    support_ticket: support_ticket;
    support_ticket_message: support_ticket_message;
    tenant: tenant;
    tenant_delivery_settings: tenant_delivery_settings;
    tenant_operational_settings: tenant_operational_settings;
    tenant_owner: tenant_owner;
    tenant_pricing_settings: tenant_pricing_settings;
    tenant_subscription: tenant_subscription;
    tenant_subscription_history: tenant_subscription_history;
    tenant_zone: tenant_zone;
    transport_manifest: transport_manifest;
    trip: trip;
    user_device_token: user_device_token;
    user_session: user_session;
    users: users;
    vehicle: vehicle;
    vehicle_assignment: vehicle_assignment;
    zone_pricing_matrix: zone_pricing_matrix;
};
