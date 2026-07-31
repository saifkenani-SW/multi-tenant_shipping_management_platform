-- =========================================================================
-- PostgreSQL DDL Database Schema Script for Logistics System
-- Generated from Prisma Schema
-- Total Tables: 40 | Enums: 27
-- Compatible with PostgreSQL 13+, pgAdmin 4, DBeaver, Supabase, Cloud SQL
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "ltree";

-- 2. CUSTOM ENUM TYPES
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'CUSTOMER_APPROVED', 'COMPANY_ACCEPTED', 'REJECTED', 'CONVERTED', 'CANCELLED', 'EXPIRED');
CREATE TYPE "ParcelStatus" AS ENUM ('CREATED', 'READY_FOR_TRANSPORT', 'IN_TRANSIT', 'READY_FOR_COLLECTION', 'COLLECTED', 'RETURNED', 'CANCELLED');
CREATE TYPE "ParcelCondition" AS ENUM ('NORMAL', 'DAMAGED', 'OPENED', 'LOST');
CREATE TYPE "ShipmentStatus" AS ENUM ('PROCESSING', 'IN_TRANSIT', 'READY_FOR_COLLECTION', 'DELIVERED', 'RETURNED');
CREATE TYPE "TripStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ManifestStatus" AS ENUM ('PENDING', 'IN_TRANSIT', 'COMPLETED');
CREATE TYPE "ManifestItemStatus" AS ENUM ('PENDING_LOAD', 'LOADED', 'UNLOADED', 'MISSING');
CREATE TYPE "QuotationType" AS ENUM ('AUTOMATIC', 'MANUAL');
CREATE TYPE "QuotationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'WITHDRAWN');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'ONLINE', 'COD', 'BANK_TRANSFER');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'EMAIL', 'IN_APP');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED');
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'PARCEL_ISSUE', 'PAYMENT', 'DELIVERY', 'OTHER');
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'TRIAL');
CREATE TYPE "VehicleStatus" AS ENUM ('ACTIVE', 'MAINTENANCE', 'INACTIVE');
CREATE TYPE "PlatformRole" AS ENUM ('SUPER_ADMIN', 'SUPPORT', 'BILLING_ADMIN');
CREATE TYPE "OrgType" AS ENUM ('REGION', 'HUB', 'WAREHOUSE', 'BRANCH', 'LOCKER');
CREATE TYPE "LocationType" AS ENUM ('COUNTRY', 'GOVERNORATE', 'CITY', 'DISTRICT', 'AREA');
CREATE TYPE "ActionType" AS ENUM ('RECEIVED_AT_BRANCH', 'LOADED_ON_TRIP', 'IN_TRANSIT', 'ARRIVED_AT_FACILITY', 'READY_FOR_COLLECTION', 'COLLECTED', 'RETURNED', 'CANCELLED', 'CONDITION_UPDATED', 'POD_COMPLETED', 'CREATED', 'TRANSFERRED');
CREATE TYPE "NotificationType" AS ENUM ('OTP', 'SHIPMENT', 'PARCEL', 'PAYMENT', 'SYSTEM', 'PROMOTION');
CREATE TYPE "PaymentResponsibility" AS ENUM ('SENDER', 'RECEIVER');
CREATE TYPE "VehicleType" AS ENUM ('Bike', 'Car', 'Van', 'Truck');
CREATE TYPE "CollectionMethod" AS ENUM ('CUSTOMER', 'REPRESENTATIVE');

-- 3. CREATE TABLES
-- Table: users (جدول المستخدمين الرئيسي للنظام (العملاء، الموظفين، الآدمن))
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "phone" VARCHAR(50) UNIQUE,
  "password_hash" VARCHAR(255) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: user_session (جلسات تسجيل دخول المستخدمين والتوكنات الحالية)
CREATE TABLE "user_session" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "hashed_refresh_token" VARCHAR(255) NOT NULL,
  "device_info" VARCHAR(255),
  "ip_address" INET,
  "expires_at" TIMESTAMP NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: platform_admin (مشرفو المنصة الرئيسية (Super Admin / Billing / Support))
CREATE TABLE "platform_admin" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID UNIQUE NOT NULL,
  "full_name" VARCHAR(255) NOT NULL,
  "role" PlatformRole NOT NULL DEFAULT 'SUPER_ADMIN',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: tenant (جدول الشركات اللوجستية المستأجرة (Multi-Tenants))
CREATE TABLE "tenant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255),
  "phone" VARCHAR(50),
  "logo_url" VARCHAR(500),
  "tax_number" VARCHAR(100),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "suspended_at" TIMESTAMP,
  "suspended_reason" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: tenant_delivery_settings (إعدادات التسليم للشركة (طلب OTP، التوقيع، الصور))
CREATE TABLE "tenant_delivery_settings" (
  "tenant_id" UUID PRIMARY KEY,
  "require_otp" BOOLEAN NOT NULL DEFAULT true,
  "require_signature" BOOLEAN NOT NULL DEFAULT true,
  "require_proof_photo" BOOLEAN NOT NULL DEFAULT true,
  "require_id_photo" BOOLEAN NOT NULL DEFAULT false,
  "allow_representative" BOOLEAN NOT NULL DEFAULT true
);

-- Table: tenant_operational_settings (إعدادات العمليات اللوجستية وإعادة فتح الشحنات والمهل)
CREATE TABLE "tenant_operational_settings" (
  "tenant_id" UUID PRIMARY KEY,
  "auto_close_shipment_after_collection" BOOLEAN NOT NULL DEFAULT true,
  "allow_shipment_reopen" BOOLEAN NOT NULL DEFAULT false,
  "allow_trip_cancellation_after_loading" BOOLEAN NOT NULL DEFAULT false,
  "require_manager_before_trip_departure" BOOLEAN NOT NULL DEFAULT false,
  "allow_return_after_collection" BOOLEAN NOT NULL DEFAULT false,
  "quotation_validity_hours" INTEGER NOT NULL DEFAULT 48
);

-- Table: tenant_pricing_settings (إعدادات التسعير والعملة الافتراضية ومعامل الوزن الحجمي)
CREATE TABLE "tenant_pricing_settings" (
  "tenant_id" UUID PRIMARY KEY,
  "volumetric_divisor" INTEGER NOT NULL DEFAULT 5000,
  "default_currency" CHAR(3) NOT NULL DEFAULT 'USD'
);

-- Table: subscription_plan (خطط الاشتراكات للمنصة (عدد الفروع، الموظفين، المركبات))
CREATE TABLE "subscription_plan" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: tenant_subscription (سجل اشتراكات الشركات الحالي والحدود المسموحة)
CREATE TABLE "tenant_subscription" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "status" SubscriptionStatus NOT NULL DEFAULT 'ACTIVE',
  "started_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP NOT NULL,
  "cancelled_at" TIMESTAMP,
  "cancellation_reason" TEXT,
  "snapshot_max_branches" INTEGER NOT NULL,
  "snapshot_max_warehouses" INTEGER NOT NULL,
  "snapshot_max_employees" INTEGER NOT NULL,
  "snapshot_max_vehicles" INTEGER NOT NULL,
  "snapshot_max_zones" INTEGER NOT NULL,
  "snapshot_max_monthly_shipments" INTEGER,
  "snapshot_max_monthly_parcels" INTEGER,
  "snapshot_features" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: tenant_subscription_history (أرشيف وتاريخ عمليات الترقية والإلغاء وتغيير خطط الاشتراكات)
CREATE TABLE "tenant_subscription_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "subscription_id" UUID NOT NULL,
  "plan_id" UUID NOT NULL,
  "action" VARCHAR(30) NOT NULL,
  "previous_plan_id" UUID,
  "notes" TEXT,
  "performed_by" UUID,
  "performed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: tenant_zone (مناطق التغطية والتسعير الخاصة بكل شركة)
CREATE TABLE "tenant_zone" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: organization_unit (الوحدات التنظيمية والفروع والمستودعات والهبات (تسلسل ltree))
CREATE TABLE "organization_unit" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "parent_id" UUID,
  "zone_id" UUID,
  "tree_path" ltree,
  "name" VARCHAR(255) NOT NULL,
  "org_type" OrgType NOT NULL,
  "address_line" VARCHAR(500),
  "location" geometry(Point, 4326),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: global_location (المواقع الجغرافية العامة (الدول، المحافظات، المدن، الأحياء))
CREATE TABLE "global_location" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "parent_id" UUID,
  "name" VARCHAR(255) NOT NULL,
  "type" LocationType NOT NULL,
  "location" geometry(Point, 4326)
);

-- Table: org_unit_location_mapping (ربط الوحدات التنظيمية مع نطاق التغطية الجغرافي العام)
CREATE TABLE "org_unit_location_mapping" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "organization_unit_id" UUID NOT NULL,
  "global_location_id" UUID NOT NULL,
  "coverage_type" VARCHAR(30) NOT NULL DEFAULT 'DELIVERY_AREA',
  CONSTRAINT "uq_org_unit_location_mapping_1" UNIQUE ("organization_unit_id", "global_location_id")
);

-- Table: employee (بيانات الموظفين التابعين لكل شركة مستأجرة)
CREATE TABLE "employee" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "employee_code" VARCHAR(50) NOT NULL,
  "national_id" VARCHAR(50),
  "full_name" VARCHAR(255) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "deactivated_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_employee_1" UNIQUE ("tenant_id", "employee_code"),
  CONSTRAINT "uq_employee_2" UNIQUE ("tenant_id", "user_id")
);

-- Table: employee_assignment (تعيينات الموظفين بالفروع والوحدات التنظيمية)
CREATE TABLE "employee_assignment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "employee_id" UUID NOT NULL,
  "organization_unit_id" UUID NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_employee_assignment_1" UNIQUE ("employee_id", "organization_unit_id")
);

-- Table: role (الأدوار والمسميات الوظيفية لكل شركة (سائق، مدخل بيانات، مدير فرع))
CREATE TABLE "role" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "description" VARCHAR(255),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_role_1" UNIQUE ("tenant_id", "name")
);

-- Table: assignment_role (منح الأدوار والصلحيات لتعيينات الموظفين)
CREATE TABLE "assignment_role" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "assignment_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  "granted_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_assignment_role_1" UNIQUE ("assignment_id", "role_id")
);

-- Table: permission (الصلاحيات الدقيقة في النظام (المورد، الإجراء))
CREATE TABLE "permission" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(150) UNIQUE NOT NULL,
  "resource" VARCHAR(100) NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "description" VARCHAR(255)
);

-- Table: role_permission (جدول الربط بين الأدوار والصلاحيات المتاحة)
CREATE TABLE "role_permission" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "role_id" UUID NOT NULL,
  "permission_id" UUID NOT NULL,
  CONSTRAINT "uq_role_permission_1" UNIQUE ("role_id", "permission_id")
);

-- Table: customer_profile (الملف الشخصي للعميل (المُرسل / المستقبل))
CREATE TABLE "customer_profile" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID UNIQUE NOT NULL,
  "full_name" VARCHAR(255) NOT NULL,
  "phone" VARCHAR(50) NOT NULL,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: customer_address (عناوين التسليم والاستلام الخاصة بالعملاء مع إحداثيات GPS)
CREATE TABLE "customer_address" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_id" UUID NOT NULL,
  "label" VARCHAR(100),
  "address_line" VARCHAR(500) NOT NULL,
  "location" geometry(Point, 4326),
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: customer_tenant (سجل تفاعل العميل مع الشركات اللوجستية المختلفة)
CREATE TABLE "customer_tenant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "customer_profile_id" UUID NOT NULL,
  "first_interaction_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_customer_tenant_1" UNIQUE ("tenant_id", "customer_profile_id")
);

-- Table: shipment_request (طلبات الشحن الأولية المرفوعة من العملاء قبل الموافقة والتسعير)
CREATE TABLE "shipment_request" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customer_profile_id" UUID NOT NULL,
  "target_tenant_id" UUID,
  "origin_org_unit_id" UUID,
  "destination_org_unit_id" UUID,
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
  "status" RequestStatus NOT NULL DEFAULT 'PENDING',
  "cancelled_at" TIMESTAMP,
  "cancellation_reason" TEXT,
  "expires_at" TIMESTAMP,
  "created_by_employee_id" UUID,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: quotation (عروض الأسعار الصادرة لطلبات الشحن (تلقائية أو يدوية))
CREATE TABLE "quotation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "shipment_request_id" UUID NOT NULL,
  "quotation_type" QuotationType NOT NULL DEFAULT 'AUTOMATIC',
  "base_price" DECIMAL(10,2),
  "weight_charge" DECIMAL(10,2),
  "extra_fees" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "amount" DECIMAL(10,2) NOT NULL,
  "pricing_snapshot" JSONB,
  "notes" TEXT,
  "valid_until" TIMESTAMP,
  "status" QuotationStatus NOT NULL DEFAULT 'PENDING',
  "submitted_by_employee_id" UUID,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: customer_shipment (الشحنات الفعلية المعتمدة للعميل مع تفاصيل المستلم والمسؤولية المالية)
CREATE TABLE "customer_shipment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "customer_profile_id" UUID NOT NULL,
  "shipment_request_id" UUID,
  "approved_quotation_id" UUID,
  "receiver_name" VARCHAR(255) NOT NULL,
  "receiver_phone" VARCHAR(50) NOT NULL,
  "receiver_address" VARCHAR(500) NOT NULL,
  "payment_responsibility" PaymentResponsibility NOT NULL DEFAULT 'SENDER',
  "total_chargeable_weight_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "status" ShipmentStatus NOT NULL DEFAULT 'PROCESSING',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: parcel (الطرود الفردية المكونة للشحنة (مع الأبعاد والوزن ورمز QR))
CREATE TABLE "parcel" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "customer_shipment_id" UUID NOT NULL,
  "tracking_number" VARCHAR(50) UNIQUE NOT NULL,
  "actual_weight_kg" DECIMAL(10,2) NOT NULL,
  "length_cm" DECIMAL(10,2) NOT NULL,
  "width_cm" DECIMAL(10,2) NOT NULL,
  "height_cm" DECIMAL(10,2) NOT NULL,
  "volumetric_weight_kg" DECIMAL(10,2),
  "current_status" ParcelStatus NOT NULL DEFAULT 'CREATED',
  "current_condition" ParcelCondition NOT NULL DEFAULT 'NORMAL',
  "current_org_unit_id" UUID,
  "qr_code_url" VARCHAR(500),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: parcel_movement (تتبع حركة الطرد التفصيلية بين الفروع والرحلات والتفريغ)
CREATE TABLE "parcel_movement" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "parcel_id" UUID NOT NULL,
  "organization_unit_id" UUID,
  "trip_id" UUID,
  "action_type" ActionType NOT NULL,
  "parcel_status_snapshot" ParcelStatus NOT NULL,
  "parcel_condition_snapshot" ParcelCondition NOT NULL DEFAULT 'NORMAL',
  "performed_by_employee_id" UUID NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: proof_of_delivery (إثبات التسليم النهائي للطرد (التوقيع، الصور، تحقق OTP، الموقع))
CREATE TABLE "proof_of_delivery" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "parcel_id" UUID UNIQUE NOT NULL,
  "delivered_by_employee_id" UUID NOT NULL,
  "collection_method" CollectionMethod NOT NULL DEFAULT 'CUSTOMER',
  "received_by_name" VARCHAR(255) NOT NULL,
  "received_by_national_id" VARCHAR(50),
  "otp_verified" BOOLEAN NOT NULL DEFAULT false,
  "otp_verified_at" TIMESTAMP,
  "signature_url" VARCHAR(500),
  "id_photo_url" VARCHAR(500),
  "parcel_photo_url" VARCHAR(500),
  "additional_photo_url" VARCHAR(500),
  "delivery_lat" DECIMAL(10,8),
  "delivery_lng" DECIMAL(11,8),
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: vehicle (أسطول المركبات اللوجستية (دراجة، سيارة، شاحنة، دراجة نارية))
CREATE TABLE "vehicle" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "plate_number" VARCHAR(50) NOT NULL,
  "type" VehicleType,
  "capacity_kg" DECIMAL(10,2),
  "status" VehicleStatus NOT NULL DEFAULT 'ACTIVE',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_vehicle_1" UNIQUE ("tenant_id", "plate_number")
);

-- Table: trip (الرحلات النقلية بين الفروع والمستودعات وسائقي المركبات)
CREATE TABLE "trip" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "driver_id" UUID NOT NULL,
  "vehicle_id" UUID,
  "origin_org_unit_id" UUID NOT NULL,
  "destination_org_unit_id" UUID NOT NULL,
  "status" TripStatus NOT NULL DEFAULT 'SCHEDULED',
  "scheduled_at" TIMESTAMP,
  "started_at" TIMESTAMP,
  "ended_at" TIMESTAMP,
  "notes" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: transport_manifest (منافيست الشحن المصاحب للرحلة والمحدد لنقاط التحميل والتفريغ)
CREATE TABLE "transport_manifest" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "trip_id" UUID NOT NULL,
  "origin_org_unit_id" UUID NOT NULL,
  "destination_org_unit_id" UUID NOT NULL,
  "status" ManifestStatus NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: manifest_item (عناصر المنافيست وحالة تحميل وتفريغ كل طرد)
CREATE TABLE "manifest_item" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "manifest_id" UUID NOT NULL,
  "parcel_id" UUID NOT NULL,
  "status" ManifestItemStatus NOT NULL DEFAULT 'PENDING_LOAD',
  "loaded_at" TIMESTAMP,
  "unloaded_at" TIMESTAMP,
  CONSTRAINT "uq_manifest_item_1" UNIQUE ("manifest_id", "parcel_id")
);

-- Table: zone_pricing_matrix (مصفوفة تسعير الشحن بين المناطق (السعر الأساسي والوزن الإضافي))
CREATE TABLE "zone_pricing_matrix" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "origin_zone_id" UUID NOT NULL,
  "destination_zone_id" UUID NOT NULL,
  "base_price" DECIMAL(10,2) NOT NULL,
  "base_weight_kg" DECIMAL(10,2) NOT NULL,
  "price_per_extra_kg" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_zone_pricing_matrix_1" UNIQUE ("tenant_id", "origin_zone_id", "destination_zone_id")
);

-- Table: invoice (الفواتير المالية الصادرة عن الشحنات والخدمات المقدمة)
CREATE TABLE "invoice" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "customer_profile_id" UUID NOT NULL,
  "customer_shipment_id" UUID,
  "invoice_number" VARCHAR(100) NOT NULL,
  "subtotal" DECIMAL(10,2) NOT NULL,
  "tax_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "total_amount" DECIMAL(10,2) NOT NULL,
  "payment_responsibility" PaymentResponsibility NOT NULL DEFAULT 'SENDER',
  "currency" CHAR(3) NOT NULL DEFAULT 'USD',
  "status" InvoiceStatus NOT NULL DEFAULT 'UNPAID',
  "due_date" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "uq_invoice_1" UNIQUE ("tenant_id", "invoice_number")
);

-- Table: payment (عمليات الدفع والتسديد للفواتير (نقدي، أونلاين، الدفع عند الاستلام))
CREATE TABLE "payment" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "collected_by_employee_id" UUID,
  "organization_unit_id" UUID,
  "amount" DECIMAL(10,2) NOT NULL,
  "payment_method" PaymentMethod NOT NULL,
  "transaction_reference" VARCHAR(255),
  "gateway_response" JSONB,
  "status" PaymentStatus NOT NULL DEFAULT 'COMPLETED',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: support_ticket (تذاكر الدعم الفني وشكاوى الشحنات والطرود)
CREATE TABLE "support_ticket" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID,
  "submitted_by_user_id" UUID NOT NULL,
  "assigned_to_employee_id" UUID,
  "subject" VARCHAR(255) NOT NULL,
  "category" TicketCategory NOT NULL DEFAULT 'GENERAL',
  "priority" TicketPriority NOT NULL DEFAULT 'MEDIUM',
  "parcel_id" UUID,
  "shipment_id" UUID,
  "status" TicketStatus NOT NULL DEFAULT 'OPEN',
  "closed_at" TIMESTAMP,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: support_ticket_message (رسائل وردود وتحديثات تذاكر الدعم الفني)
CREATE TABLE "support_ticket_message" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticket_id" UUID NOT NULL,
  "sender_user_id" UUID NOT NULL,
  "message" TEXT NOT NULL,
  "attachments" JSONB,
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: notification (إشعارات النظام والعملاء (SMS, Push, In-App, Email))
CREATE TABLE "notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID,
  "recipient_user_id" UUID NOT NULL,
  "notification_type" NotificationType NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "body" TEXT NOT NULL,
  "data" JSONB,
  "channel" NotificationChannel NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP,
  "sent_at" TIMESTAMP,
  "status" NotificationStatus NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table: audit_log (سجلات التدقيق الأمني والعمليات لجميع التغييرات بالنظام)
CREATE TABLE "audit_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE INDEXES
CREATE INDEX "idx_user_session_user_id" ON "user_session" ("user_id");
CREATE INDEX "idx_org_unit_location" ON "organization_unit" USING GIST ("location");
CREATE INDEX "idx_global_location_geom" ON "global_location" USING GIST ("location");
CREATE INDEX "idx_customer_address_location" ON "customer_address" USING GIST ("location");
CREATE INDEX "idx_customer_shipment_customer" ON "customer_shipment" ("customer_profile_id");
CREATE INDEX "idx_customer_shipment_tenant" ON "customer_shipment" ("tenant_id");

-- 5. FOREIGN KEY CONSTRAINTS
ALTER TABLE "user_session" ADD CONSTRAINT "fk_user_session_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "platform_admin" ADD CONSTRAINT "fk_platform_admin_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "tenant_delivery_settings" ADD CONSTRAINT "fk_tenant_delivery_settings_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "tenant_operational_settings" ADD CONSTRAINT "fk_tenant_operational_settings_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "tenant_pricing_settings" ADD CONSTRAINT "fk_tenant_pricing_settings_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "tenant_subscription" ADD CONSTRAINT "fk_tenant_subscription_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "tenant_subscription" ADD CONSTRAINT "fk_tenant_subscription_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan" ("id") ON DELETE NO ACTION;
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "fk_tenant_subscription_history_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "fk_tenant_subscription_history_subscription_id" FOREIGN KEY ("subscription_id") REFERENCES "tenant_subscription" ("id") ON DELETE CASCADE;
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "fk_tenant_subscription_history_plan_id" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan" ("id") ON DELETE NO ACTION;
ALTER TABLE "tenant_subscription_history" ADD CONSTRAINT "fk_tenant_subscription_history_previous_plan_id" FOREIGN KEY ("previous_plan_id") REFERENCES "subscription_plan" ("id") ON DELETE NO ACTION;
ALTER TABLE "tenant_zone" ADD CONSTRAINT "fk_tenant_zone_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "organization_unit" ADD CONSTRAINT "fk_organization_unit_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "organization_unit" ADD CONSTRAINT "fk_organization_unit_parent_id" FOREIGN KEY ("parent_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "organization_unit" ADD CONSTRAINT "fk_organization_unit_zone_id" FOREIGN KEY ("zone_id") REFERENCES "tenant_zone" ("id") ON DELETE NO ACTION;
ALTER TABLE "global_location" ADD CONSTRAINT "fk_global_location_parent_id" FOREIGN KEY ("parent_id") REFERENCES "global_location" ("id") ON DELETE NO ACTION;
ALTER TABLE "org_unit_location_mapping" ADD CONSTRAINT "fk_org_unit_location_mapping_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "org_unit_location_mapping" ADD CONSTRAINT "fk_org_unit_location_mapping_organization_unit_id" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "org_unit_location_mapping" ADD CONSTRAINT "fk_org_unit_location_mapping_global_location_id" FOREIGN KEY ("global_location_id") REFERENCES "global_location" ("id") ON DELETE NO ACTION;
ALTER TABLE "employee" ADD CONSTRAINT "fk_employee_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "employee" ADD CONSTRAINT "fk_employee_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "employee_assignment" ADD CONSTRAINT "fk_employee_assignment_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "employee_assignment" ADD CONSTRAINT "fk_employee_assignment_employee_id" FOREIGN KEY ("employee_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "employee_assignment" ADD CONSTRAINT "fk_employee_assignment_organization_unit_id" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "role" ADD CONSTRAINT "fk_role_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "assignment_role" ADD CONSTRAINT "fk_assignment_role_assignment_id" FOREIGN KEY ("assignment_id") REFERENCES "employee_assignment" ("id") ON DELETE CASCADE;
ALTER TABLE "assignment_role" ADD CONSTRAINT "fk_assignment_role_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("id") ON DELETE CASCADE;
ALTER TABLE "role_permission" ADD CONSTRAINT "fk_role_permission_role_id" FOREIGN KEY ("role_id") REFERENCES "role" ("id") ON DELETE CASCADE;
ALTER TABLE "role_permission" ADD CONSTRAINT "fk_role_permission_permission_id" FOREIGN KEY ("permission_id") REFERENCES "permission" ("id") ON DELETE NO ACTION;
ALTER TABLE "customer_profile" ADD CONSTRAINT "fk_customer_profile_user_id" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE;
ALTER TABLE "customer_address" ADD CONSTRAINT "fk_customer_address_customer_id" FOREIGN KEY ("customer_id") REFERENCES "customer_profile" ("id") ON DELETE CASCADE;
ALTER TABLE "customer_tenant" ADD CONSTRAINT "fk_customer_tenant_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "customer_tenant" ADD CONSTRAINT "fk_customer_tenant_customer_profile_id" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile" ("id") ON DELETE CASCADE;
ALTER TABLE "shipment_request" ADD CONSTRAINT "fk_shipment_request_customer_profile_id" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile" ("id") ON DELETE CASCADE;
ALTER TABLE "shipment_request" ADD CONSTRAINT "fk_shipment_request_target_tenant_id" FOREIGN KEY ("target_tenant_id") REFERENCES "tenant" ("id") ON DELETE NO ACTION;
ALTER TABLE "shipment_request" ADD CONSTRAINT "fk_shipment_request_origin_org_unit_id" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "shipment_request" ADD CONSTRAINT "fk_shipment_request_destination_org_unit_id" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "shipment_request" ADD CONSTRAINT "fk_shipment_request_created_by_employee_id" FOREIGN KEY ("created_by_employee_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "quotation" ADD CONSTRAINT "fk_quotation_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "quotation" ADD CONSTRAINT "fk_quotation_shipment_request_id" FOREIGN KEY ("shipment_request_id") REFERENCES "shipment_request" ("id") ON DELETE NO ACTION;
ALTER TABLE "quotation" ADD CONSTRAINT "fk_quotation_submitted_by_employee_id" FOREIGN KEY ("submitted_by_employee_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "customer_shipment" ADD CONSTRAINT "fk_customer_shipment_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "customer_shipment" ADD CONSTRAINT "fk_customer_shipment_customer_profile_id" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile" ("id") ON DELETE CASCADE;
ALTER TABLE "customer_shipment" ADD CONSTRAINT "fk_customer_shipment_shipment_request_id" FOREIGN KEY ("shipment_request_id") REFERENCES "shipment_request" ("id") ON DELETE NO ACTION;
ALTER TABLE "customer_shipment" ADD CONSTRAINT "fk_customer_shipment_approved_quotation_id" FOREIGN KEY ("approved_quotation_id") REFERENCES "quotation" ("id") ON DELETE NO ACTION;
ALTER TABLE "parcel" ADD CONSTRAINT "fk_parcel_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "parcel" ADD CONSTRAINT "fk_parcel_customer_shipment_id" FOREIGN KEY ("customer_shipment_id") REFERENCES "customer_shipment" ("id") ON DELETE NO ACTION;
ALTER TABLE "parcel" ADD CONSTRAINT "fk_parcel_current_org_unit_id" FOREIGN KEY ("current_org_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "parcel_movement" ADD CONSTRAINT "fk_parcel_movement_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "parcel_movement" ADD CONSTRAINT "fk_parcel_movement_parcel_id" FOREIGN KEY ("parcel_id") REFERENCES "parcel" ("id") ON DELETE CASCADE;
ALTER TABLE "parcel_movement" ADD CONSTRAINT "fk_parcel_movement_organization_unit_id" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "parcel_movement" ADD CONSTRAINT "fk_parcel_movement_trip_id" FOREIGN KEY ("trip_id") REFERENCES "trip" ("id") ON DELETE NO ACTION;
ALTER TABLE "parcel_movement" ADD CONSTRAINT "fk_parcel_movement_performed_by_employee_id" FOREIGN KEY ("performed_by_employee_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "fk_proof_of_delivery_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "fk_proof_of_delivery_parcel_id" FOREIGN KEY ("parcel_id") REFERENCES "parcel" ("id") ON DELETE CASCADE;
ALTER TABLE "proof_of_delivery" ADD CONSTRAINT "fk_proof_of_delivery_delivered_by_employee_id" FOREIGN KEY ("delivered_by_employee_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "vehicle" ADD CONSTRAINT "fk_vehicle_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_driver_id" FOREIGN KEY ("driver_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle" ("id") ON DELETE NO ACTION;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_origin_org_unit_id" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "trip" ADD CONSTRAINT "fk_trip_destination_org_unit_id" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "transport_manifest" ADD CONSTRAINT "fk_transport_manifest_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "transport_manifest" ADD CONSTRAINT "fk_transport_manifest_trip_id" FOREIGN KEY ("trip_id") REFERENCES "trip" ("id") ON DELETE NO ACTION;
ALTER TABLE "transport_manifest" ADD CONSTRAINT "fk_transport_manifest_origin_org_unit_id" FOREIGN KEY ("origin_org_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "transport_manifest" ADD CONSTRAINT "fk_transport_manifest_destination_org_unit_id" FOREIGN KEY ("destination_org_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "manifest_item" ADD CONSTRAINT "fk_manifest_item_manifest_id" FOREIGN KEY ("manifest_id") REFERENCES "transport_manifest" ("id") ON DELETE CASCADE;
ALTER TABLE "manifest_item" ADD CONSTRAINT "fk_manifest_item_parcel_id" FOREIGN KEY ("parcel_id") REFERENCES "parcel" ("id") ON DELETE CASCADE;
ALTER TABLE "zone_pricing_matrix" ADD CONSTRAINT "fk_zone_pricing_matrix_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "zone_pricing_matrix" ADD CONSTRAINT "fk_zone_pricing_matrix_origin_zone_id" FOREIGN KEY ("origin_zone_id") REFERENCES "tenant_zone" ("id") ON DELETE NO ACTION;
ALTER TABLE "zone_pricing_matrix" ADD CONSTRAINT "fk_zone_pricing_matrix_destination_zone_id" FOREIGN KEY ("destination_zone_id") REFERENCES "tenant_zone" ("id") ON DELETE NO ACTION;
ALTER TABLE "invoice" ADD CONSTRAINT "fk_invoice_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "invoice" ADD CONSTRAINT "fk_invoice_customer_profile_id" FOREIGN KEY ("customer_profile_id") REFERENCES "customer_profile" ("id") ON DELETE CASCADE;
ALTER TABLE "invoice" ADD CONSTRAINT "fk_invoice_customer_shipment_id" FOREIGN KEY ("customer_shipment_id") REFERENCES "customer_shipment" ("id") ON DELETE NO ACTION;
ALTER TABLE "payment" ADD CONSTRAINT "fk_payment_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "payment" ADD CONSTRAINT "fk_payment_invoice_id" FOREIGN KEY ("invoice_id") REFERENCES "invoice" ("id") ON DELETE NO ACTION;
ALTER TABLE "payment" ADD CONSTRAINT "fk_payment_collected_by_employee_id" FOREIGN KEY ("collected_by_employee_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "payment" ADD CONSTRAINT "fk_payment_organization_unit_id" FOREIGN KEY ("organization_unit_id") REFERENCES "organization_unit" ("id") ON DELETE NO ACTION;
ALTER TABLE "support_ticket" ADD CONSTRAINT "fk_support_ticket_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "support_ticket" ADD CONSTRAINT "fk_support_ticket_submitted_by_user_id" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users" ("id") ON DELETE NO ACTION;
ALTER TABLE "support_ticket" ADD CONSTRAINT "fk_support_ticket_assigned_to_employee_id" FOREIGN KEY ("assigned_to_employee_id") REFERENCES "employee" ("id") ON DELETE NO ACTION;
ALTER TABLE "support_ticket" ADD CONSTRAINT "fk_support_ticket_parcel_id" FOREIGN KEY ("parcel_id") REFERENCES "parcel" ("id") ON DELETE CASCADE;
ALTER TABLE "support_ticket" ADD CONSTRAINT "fk_support_ticket_shipment_id" FOREIGN KEY ("shipment_id") REFERENCES "customer_shipment" ("id") ON DELETE NO ACTION;
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "fk_support_ticket_message_ticket_id" FOREIGN KEY ("ticket_id") REFERENCES "support_ticket" ("id") ON DELETE CASCADE;
ALTER TABLE "support_ticket_message" ADD CONSTRAINT "fk_support_ticket_message_sender_user_id" FOREIGN KEY ("sender_user_id") REFERENCES "users" ("id") ON DELETE NO ACTION;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_recipient_user_id" FOREIGN KEY ("recipient_user_id") REFERENCES "users" ("id") ON DELETE NO ACTION;
ALTER TABLE "audit_log" ADD CONSTRAINT "fk_audit_log_tenant_id" FOREIGN KEY ("tenant_id") REFERENCES "tenant" ("id") ON DELETE CASCADE;
ALTER TABLE "audit_log" ADD CONSTRAINT "fk_audit_log_actor_user_id" FOREIGN KEY ("actor_user_id") REFERENCES "users" ("id") ON DELETE NO ACTION;

