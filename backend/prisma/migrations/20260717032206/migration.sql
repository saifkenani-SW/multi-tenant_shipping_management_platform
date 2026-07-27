-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "ltree";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'CUSTOMER_APPROVED', 'COMPANY_ACCEPTED', 'CONVERTED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('CREATED', 'READY_FOR_TRANSPORT', 'IN_TRANSIT', 'READY_FOR_COLLECTION', 'COLLECTED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ParcelCondition" AS ENUM ('NORMAL', 'DAMAGED', 'OPENED', 'LOST');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PROCESSING', 'IN_TRANSIT', 'READY_FOR_COLLECTION', 'DELIVERED', 'RETURNED');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ManifestStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ManifestItemStatus" AS ENUM ('PENDING_LOAD', 'LOADED', 'UNLOADED', 'MISSING');

-- CreateEnum
CREATE TYPE "QuotationType" AS ENUM ('AUTOMATIC', 'MANUAL');

-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE', 'COD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'EMAIL', 'IN_APP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'PARCEL_ISSUE', 'PAYMENT', 'DELIVERY', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'TRIAL');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT', 'BILLING_ADMIN');

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('REGION', 'HUB', 'WAREHOUSE', 'BRANCH', 'LOCKER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('COUNTRY', 'GOVERNORATE', 'CITY', 'DISTRICT', 'AREA');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('RECEIVED_AT_BRANCH', 'LOADED_ON_TRIP', 'IN_TRANSIT', 'ARRIVED_AT_FACILITY', 'READY_FOR_COLLECTION', 'COLLECTED', 'RETURNED', 'CANCELLED', 'CONDITION_UPDATED', 'POD_COMPLETED', 'CREATED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('OTP', 'SHIPMENT', 'PARCEL', 'PAYMENT', 'SYSTEM', 'PROMOTION');

-- CreateEnum
CREATE TYPE "PaymentResponsibility" AS ENUM ('SENDER', 'RECEIVER');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('Bike', 'Car', 'Van', 'Truck');

-- CreateEnum
CREATE TYPE "CollectionMethod" AS ENUM ('CUSTOMER', 'REPRESENTATIVE');

-- CreateTable
CREATE TABLE "assignment_role" (
    "id" UUID NOT NULL,
    "assignment_id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "granted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assignment_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "actor_user_id" UUID,
    "actor_ip" INET,
    "actor_user_agent" TEXT,
    "event_type" VARCHAR(50) NOT NULL,
    "entity_type" VARCHAR(50),
    "entity_id" UUID,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_address" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "label" VARCHAR(100),
    "address_line" VARCHAR(500) NOT NULL,
    "location" geometry(Point, 4326),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_profile" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_shipment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_profile_id" UUID NOT NULL,
    "shipment_request_id" UUID,
    "approved_quotation_id" UUID,
    "receiver_name" VARCHAR(255) NOT NULL,
    "receiver_phone" VARCHAR(50) NOT NULL,
    "receiver_address" VARCHAR(500) NOT NULL,
    "payment_responsibility" "PaymentResponsibility" NOT NULL DEFAULT 'SENDER',
    "total_chargeable_weight_kg" DECIMAL(10,2) DEFAULT 0,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PROCESSING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tenant" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_profile_id" UUID NOT NULL,
    "first_interaction_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "employee_code" VARCHAR(50) NOT NULL,
    "national_id" VARCHAR(50),
    "full_name" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deactivated_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_assignment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "organization_unit_id" UUID NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_location" (
    "id" UUID NOT NULL,
    "parent_id" UUID,
    "name" VARCHAR(255) NOT NULL,
    "type" "LocationType" NOT NULL,
    "location" geometry(Point, 4326),

    CONSTRAINT "global_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoice" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_profile_id" UUID NOT NULL,
    "customer_shipment_id" UUID,
    "invoice_number" VARCHAR(100) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "payment_responsibility" "PaymentResponsibility" NOT NULL DEFAULT 'SENDER',
    "currency" CHAR(3) NOT NULL DEFAULT 'USD',
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "due_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manifest_item" (
    "id" UUID NOT NULL,
    "manifest_id" UUID NOT NULL,
    "parcel_id" UUID NOT NULL,
    "status" "ManifestItemStatus" NOT NULL DEFAULT 'PENDING_LOAD',
    "loaded_at" TIMESTAMP(6),
    "unloaded_at" TIMESTAMP(6),

    CONSTRAINT "manifest_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "recipient_user_id" UUID NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "channel" "NotificationChannel" NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(6),
    "sent_at" TIMESTAMP(6),
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_unit" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parent_id" UUID,
    "zone_id" UUID,
    "tree_path" ltree,
    "name" VARCHAR(255) NOT NULL,
    "org_type" "OrgType" NOT NULL,
    "address_line" VARCHAR(500),
    "location" geometry(Point, 4326),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "customer_shipment_id" UUID NOT NULL,
    "tracking_number" VARCHAR(50) NOT NULL,
    "actual_weight_kg" DECIMAL(10,2) NOT NULL,
    "length_cm" DECIMAL(10,2) NOT NULL,
    "width_cm" DECIMAL(10,2) NOT NULL,
    "height_cm" DECIMAL(10,2) NOT NULL,
    "volumetric_weight_kg" DECIMAL(10,2),
    "current_status" "ParcelStatus" NOT NULL DEFAULT 'CREATED',
    "current_condition" "ParcelCondition" NOT NULL DEFAULT 'NORMAL',
    "current_org_unit_id" UUID,
    "qr_code_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_movement" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parcel_id" UUID NOT NULL,
    "organization_unit_id" UUID,
    "trip_id" UUID,
    "action_type" "ActionType" NOT NULL,
    "parcel_status_snapshot" "ParcelStatus" NOT NULL,
    "parcel_condition_snapshot" "ParcelCondition" NOT NULL DEFAULT 'NORMAL',
    "performed_by_employee_id" UUID NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "collected_by_employee_id" UUID,
    "organization_unit_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_method" "PaymentMethod" NOT NULL,
    "transaction_reference" VARCHAR(255),
    "gateway_response" JSONB,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proof_of_delivery" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "parcel_id" UUID NOT NULL,
    "delivered_by_employee_id" UUID NOT NULL,
    "collection_method" "CollectionMethod" NOT NULL DEFAULT 'CUSTOMER',
    "received_by_name" VARCHAR(255) NOT NULL,
    "received_by_national_id" VARCHAR(50),
    "otp_verified" BOOLEAN NOT NULL DEFAULT false,
    "otp_verified_at" TIMESTAMP(6),
    "signature_url" VARCHAR(500),
    "id_photo_url" VARCHAR(500),
    "parcel_photo_url" VARCHAR(500),
    "additional_photo_url" VARCHAR(500),
    "delivery_lat" DECIMAL(10,8),
    "delivery_lng" DECIMAL(11,8),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proof_of_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotation" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "shipment_request_id" UUID NOT NULL,
    "quotation_type" "QuotationType" NOT NULL DEFAULT 'AUTOMATIC',
    "base_price" DECIMAL(10,2),
    "weight_charge" DECIMAL(10,2),
    "extra_fees" DECIMAL(10,2) DEFAULT 0,
    "amount" DECIMAL(10,2) NOT NULL,
    "pricing_snapshot" JSONB,
    "notes" TEXT,
    "valid_until" TIMESTAMP(6),
    "status" "QuotationStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_by_employee_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permission" (
    "id" UUID NOT NULL,
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_request" (
    "id" UUID NOT NULL,
    "customer_profile_id" UUID NOT NULL,
    "target_tenant_id" UUID,
    "sender_name" VARCHAR(255) NOT NULL,
    "sender_phone" VARCHAR(50) NOT NULL,
    "sender_address" VARCHAR(500) NOT NULL,
    "sender_lat" DECIMAL(10,8),
    "sender_lng" DECIMAL(11,8),
    "receiver_name" VARCHAR(255) NOT NULL,
    "receiver_phone" VARCHAR(50) NOT NULL,
    "receiver_address" VARCHAR(500) NOT NULL,
    "receiver_lat" DECIMAL(10,8),
    "receiver_lng" DECIMAL(11,8),
    "expected_pieces_count" INTEGER NOT NULL DEFAULT 1,
    "expected_total_weight_kg" DECIMAL(10,2),
    "notes" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "cancelled_at" TIMESTAMP(6),
    "cancellation_reason" TEXT,
    "expires_at" TIMESTAMP(6),
    "created_by_employee_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "max_branches" INTEGER NOT NULL DEFAULT 5,
    "max_warehouses" INTEGER NOT NULL DEFAULT 2,
    "max_employees" INTEGER NOT NULL DEFAULT 20,
    "max_vehicles" INTEGER NOT NULL DEFAULT 10,
    "max_zones" INTEGER NOT NULL DEFAULT 3,
    "max_monthly_shipments" INTEGER,
    "max_monthly_parcels" INTEGER,
    "price_monthly" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "price_yearly" DECIMAL(10,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket" (
    "id" UUID NOT NULL,
    "tenant_id" UUID,
    "submitted_by_user_id" UUID NOT NULL,
    "assigned_to_employee_id" UUID,
    "subject" VARCHAR(255) NOT NULL,
    "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "parcel_id" UUID,
    "shipment_id" UUID,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "closed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket_message" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sender_user_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "org_unit_location_mapping" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "organization_unit_id" UUID NOT NULL,
    "global_location_id" UUID NOT NULL,
    "coverage_type" VARCHAR(30) NOT NULL DEFAULT 'DELIVERY_AREA',

    CONSTRAINT "org_unit_location_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant" (
    "id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "logo_url" VARCHAR(500),
    "tax_number" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "suspended_at" TIMESTAMP(6),
    "suspended_reason" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_delivery_settings" (
    "tenant_id" UUID NOT NULL,
    "require_otp" BOOLEAN NOT NULL DEFAULT true,
    "require_signature" BOOLEAN NOT NULL DEFAULT true,
    "require_proof_photo" BOOLEAN NOT NULL DEFAULT true,
    "require_id_photo" BOOLEAN NOT NULL DEFAULT false,
    "allow_representative" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tenant_delivery_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "tenant_operational_settings" (
    "tenant_id" UUID NOT NULL,
    "auto_close_shipment_after_collection" BOOLEAN NOT NULL DEFAULT true,
    "allow_shipment_reopen" BOOLEAN NOT NULL DEFAULT false,
    "allow_trip_cancellation_after_loading" BOOLEAN NOT NULL DEFAULT false,
    "require_manager_before_trip_departure" BOOLEAN NOT NULL DEFAULT false,
    "allow_return_after_collection" BOOLEAN NOT NULL DEFAULT false,
    "quotation_validity_hours" INTEGER NOT NULL DEFAULT 48,

    CONSTRAINT "tenant_operational_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "tenant_pricing_settings" (
    "tenant_id" UUID NOT NULL,
    "volumetric_divisor" INTEGER NOT NULL DEFAULT 5000,
    "default_currency" CHAR(3) NOT NULL DEFAULT 'USD',

    CONSTRAINT "tenant_pricing_settings_pkey" PRIMARY KEY ("tenant_id")
);

-- CreateTable
CREATE TABLE "tenant_subscription" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "cancelled_at" TIMESTAMP(6),
    "cancellation_reason" TEXT,
    "snapshot_max_branches" INTEGER NOT NULL,
    "snapshot_max_warehouses" INTEGER NOT NULL,
    "snapshot_max_employees" INTEGER NOT NULL,
    "snapshot_max_vehicles" INTEGER NOT NULL,
    "snapshot_max_zones" INTEGER NOT NULL,
    "snapshot_max_monthly_shipments" INTEGER,
    "snapshot_max_monthly_parcels" INTEGER,
    "snapshot_features" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_subscription_history" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "subscription_id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "previous_plan_id" UUID,
    "notes" TEXT,
    "performed_by" UUID,
    "performed_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_subscription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_zone" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_zone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_manifest" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "origin_org_unit_id" UUID NOT NULL,
    "destination_org_unit_id" UUID NOT NULL,
    "status" "ManifestStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_manifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trip" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "driver_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "origin_org_unit_id" UUID NOT NULL,
    "destination_org_unit_id" UUID NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduled_at" TIMESTAMP(6),
    "started_at" TIMESTAMP(6),
    "ended_at" TIMESTAMP(6),
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_session" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "hashed_refresh_token" VARCHAR(255) NOT NULL,
    "device_info" VARCHAR(255),
    "ip_address" INET,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_admin" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" "PlatformRole" NOT NULL DEFAULT 'SUPER_ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "plate_number" VARCHAR(50) NOT NULL,
    "type" "VehicleType",
    "capacity_kg" DECIMAL(10,2),
    "status" "VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zone_pricing_matrix" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "origin_zone_id" UUID NOT NULL,
    "destination_zone_id" UUID NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "base_weight_kg" DECIMAL(10,2) NOT NULL,
    "price_per_extra_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zone_pricing_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_assignment_role" ON "assignment_role"("assignment_id", "role_id");

-- CreateIndex
CREATE INDEX "idx_customer_address_location" ON "customer_address" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "customer_profile_user_id_key" ON "customer_profile"("user_id");

-- CreateIndex
CREATE INDEX "idx_customer_shipment_customer" ON "customer_shipment"("customer_profile_id");

-- CreateIndex
CREATE INDEX "idx_customer_shipment_tenant" ON "customer_shipment"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_customer_tenant" ON "customer_tenant"("tenant_id", "customer_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tenant_emp_code" ON "employee"("tenant_id", "employee_code");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tenant_user" ON "employee"("tenant_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_employee_org_unit" ON "employee_assignment"("employee_id", "organization_unit_id");

-- CreateIndex
CREATE INDEX "idx_global_location_geom" ON "global_location" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tenant_invoice" ON "invoice"("tenant_id", "invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_manifest_parcel" ON "manifest_item"("manifest_id", "parcel_id");

-- CreateIndex
CREATE INDEX "idx_org_unit_location" ON "organization_unit" USING GIST ("location");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tracking" ON "parcel"("tracking_number");

-- CreateIndex
CREATE UNIQUE INDEX "permission_name_key" ON "permission"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_parcel_pod" ON "proof_of_delivery"("parcel_id");

-- CreateIndex
CREATE UNIQUE INDEX "quotation_shipment_request_id_key" ON "quotation"("shipment_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_tenant_role_name" ON "role"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_role_permission" ON "role_permission"("role_id", "permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_org_location" ON "org_unit_location_mapping"("organization_unit_id", "global_location_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "user_session_user_id_idx" ON "user_session"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "platform_admin_user_id_key" ON "platform_admin"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_plate_tenant" ON "vehicle"("tenant_id", "plate_number");

-- CreateIndex
CREATE UNIQUE INDEX "uq_pricing_route" ON "zone_pricing_matrix"("tenant_id", "origin_zone_id", "destination_zone_id");

-- AddForeignKey
ALTER TABLE "assignment_role" ADD CONSTRAINT "assignment_role_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "employee_assignment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "assignment_role" ADD CONSTRAINT "assignment_role_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_address" ADD CONSTRAINT "customer_address_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_profile" ADD CONSTRAINT "customer_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_approved_quotation_id_fkey" FOREIGN KEY ("approved_quotation_id") REFERENCES "quotation"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_customer_profile_id_fkey" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_shipment_request_id_fkey" FOREIGN KEY ("shipment_request_id") REFERENCES "shipment_request"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_shipment" ADD CONSTRAINT "customer_shipment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_tenant" ADD CONSTRAINT "customer_tenant_customer_profile_id_fkey" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "customer_tenant" ADD CONSTRAINT "customer_tenant_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee" ADD CONSTRAINT "employee_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_assignment" ADD CONSTRAINT "employee_assignment_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_assignment" ADD CONSTRAINT "employee_assignment_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "employee_assignment" ADD CONSTRAINT "employee_assignment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "global_location" ADD CONSTRAINT "global_location_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "global_location"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_profile_id_fkey" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_shipment_id_fkey" FOREIGN KEY ("customer_shipment_id") REFERENCES "customer_shipment"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "manifest_item" ADD CONSTRAINT "manifest_item_manifest_id_fkey" FOREIGN KEY ("manifest_id") REFERENCES "transport_manifest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "manifest_item" ADD CONSTRAINT "manifest_item_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcel"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_unit" ADD CONSTRAINT "organization_unit_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_unit" ADD CONSTRAINT "organization_unit_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "organization_unit" ADD CONSTRAINT "organization_unit_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "tenant_zone"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_current_org_unit_id_fkey" FOREIGN KEY ("current_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_customer_shipment_id_fkey" FOREIGN KEY ("customer_shipment_id") REFERENCES "customer_shipment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel" ADD CONSTRAINT "parcel_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel_movement" ADD CONSTRAINT "parcel_movement_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel_movement" ADD CONSTRAINT "parcel_movement_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcel"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel_movement" ADD CONSTRAINT "parcel_movement_performed_by_employee_id_fkey" FOREIGN KEY ("performed_by_employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel_movement" ADD CONSTRAINT "parcel_movement_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "parcel_movement" ADD CONSTRAINT "parcel_movement_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_collected_by_employee_id_fkey" FOREIGN KEY ("collected_by_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoice"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_delivered_by_employee_id_fkey" FOREIGN KEY ("delivered_by_employee_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcel"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "proof_of_delivery_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_shipment_request_id_fkey" FOREIGN KEY ("shipment_request_id") REFERENCES "shipment_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_submitted_by_employee_id_fkey" FOREIGN KEY ("submitted_by_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quotation" ADD CONSTRAINT "quotation_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role" ADD CONSTRAINT "role_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "role_permission" ADD CONSTRAINT "role_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_customer_profile_id_fkey" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "shipment_request" ADD CONSTRAINT "shipment_request_target_tenant_id_fkey" FOREIGN KEY ("target_tenant_id") REFERENCES "tenant"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_assigned_to_employee_id_fkey" FOREIGN KEY ("assigned_to_employee_id") REFERENCES "employee"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_parcel_id_fkey" FOREIGN KEY ("parcel_id") REFERENCES "parcel"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "customer_shipment"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_sender_user_id_fkey" FOREIGN KEY ("sender_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "support_ticket_message_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_ticket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_unit_location_mapping" ADD CONSTRAINT "org_unit_location_mapping_global_location_id_fkey" FOREIGN KEY ("global_location_id") REFERENCES "global_location"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_unit_location_mapping" ADD CONSTRAINT "org_unit_location_mapping_organization_unit_id_fkey" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "org_unit_location_mapping" ADD CONSTRAINT "org_unit_location_mapping_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_delivery_settings" ADD CONSTRAINT "tenant_delivery_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_operational_settings" ADD CONSTRAINT "tenant_operational_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_pricing_settings" ADD CONSTRAINT "tenant_pricing_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_subscription" ADD CONSTRAINT "tenant_subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_subscription" ADD CONSTRAINT "tenant_subscription_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "tenant_subscription_history_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "tenant_subscription_history_previous_plan_id_fkey" FOREIGN KEY ("previous_plan_id") REFERENCES "subscription_plan"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "tenant_subscription_history_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscription"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "tenant_subscription_history_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tenant_zone" ADD CONSTRAINT "tenant_zone_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transport_manifest" ADD CONSTRAINT "transport_manifest_destination_org_unit_id_fkey" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transport_manifest" ADD CONSTRAINT "transport_manifest_origin_org_unit_id_fkey" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transport_manifest" ADD CONSTRAINT "transport_manifest_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transport_manifest" ADD CONSTRAINT "transport_manifest_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trip"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_destination_org_unit_id_fkey" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_origin_org_unit_id_fkey" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "trip" ADD CONSTRAINT "trip_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_admin" ADD CONSTRAINT "platform_admin_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zone_pricing_matrix" ADD CONSTRAINT "zone_pricing_matrix_destination_zone_id_fkey" FOREIGN KEY ("destination_zone_id") REFERENCES "tenant_zone"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zone_pricing_matrix" ADD CONSTRAINT "zone_pricing_matrix_origin_zone_id_fkey" FOREIGN KEY ("origin_zone_id") REFERENCES "tenant_zone"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "zone_pricing_matrix" ADD CONSTRAINT "zone_pricing_matrix_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
