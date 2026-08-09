import { Injectable } from '@nestjs/common';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantDetailsDto } from '../dtos/responses/tenant-details.dto';
import {
  PaginatedTenantListDto,
  TenantListDto,
} from '../dtos/responses/tenant-list.dto';
import { Pagination, PaginationMeta } from '../../../../common/pagination';
import { TenantSubscription } from '../../domain/entities/tenant-subscription.entity';
import { TenantSubscriptionHistory } from '../../domain/entities/tenant-subscription-history.entity';
import { TenantSubscriptionDto } from '../dtos/responses/tenant-subscription.dto';
import { TenantSubscriptionHistoryDto } from '../dtos/responses/tenant-subscription-history.dto';
import {
  DeliverySettingsDto,
  OperationalSettingsDto,
  PricingSettingsDto,
  TenantSettingsDto,
} from '../dtos/responses/tenant-settings.dto';

@Injectable()
export class TenantResponseMapper {
  toListDto(tenant: Tenant): TenantListDto {
    const dto = new TenantListDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    dto.logoUrl = tenant.logoUrl;
    dto.status = tenant.status;
    dto.createdAt = tenant.createdAt;
    return dto;
  }

  toDetailsDto(tenant: Tenant): TenantDetailsDto {
    const dto = new TenantDetailsDto();
    dto.id = tenant.id;
    dto.name = tenant.name;
    dto.status = tenant.status;
    dto.taxNumber = tenant.taxNumber;
    dto.email = tenant.email;
    dto.phone = tenant.phone;
    dto.logoUrl = tenant.logoUrl;
    dto.createdAt = tenant.createdAt;
    dto.updatedAt = tenant.updatedAt;
    dto.suspendedAt = tenant.suspendedAt;
    dto.suspendedReason = tenant.suspendedReason;
    return dto;
  }

  toPaginatedListDto(
    tenants: Tenant[],
    total: number,
    pagination: Pagination,
  ): PaginatedTenantListDto {
    const dto = new PaginatedTenantListDto();
    dto.data = tenants.map((tenant) => this.toListDto(tenant));
    dto.meta = new PaginationMeta(pagination, total);
    return dto;
  }

  toSubscriptionDto(subscription: TenantSubscription): TenantSubscriptionDto {
    const dto = new TenantSubscriptionDto();
    dto.id = subscription.id;
    dto.tenantId = subscription.tenantId;
    dto.planId = subscription.planId;
    dto.status = subscription.status;
    dto.startedAt = subscription.startedAt;
    dto.expiresAt = subscription.expiresAt;
    dto.snapshotMaxBranches = subscription.snapshotMaxBranches;
    dto.snapshotMaxWarehouses = subscription.snapshotMaxWarehouses;
    dto.snapshotMaxEmployees = subscription.snapshotMaxEmployees;
    dto.snapshotMaxVehicles = subscription.snapshotMaxVehicles;
    dto.snapshotMaxZones = subscription.snapshotMaxZones;
    dto.snapshotMaxMonthlyShipments = subscription.snapshotMaxMonthlyShipments;
    dto.snapshotMaxMonthlyParcels = subscription.snapshotMaxMonthlyParcels;
    dto.snapshotFeatures = subscription.snapshotFeatures;
    dto.createdAt = subscription.createdAt;
    dto.updatedAt = subscription.updatedAt;
    dto.cancelledAt = subscription.cancelledAt;
    dto.cancellationReason = subscription.cancellationReason;
    return dto;
  }

  toSubscriptionHistoryDto(
    history: TenantSubscriptionHistory,
  ): TenantSubscriptionHistoryDto {
    const dto = new TenantSubscriptionHistoryDto();
    dto.id = history.id;
    dto.tenantId = history.tenantId;
    dto.subscriptionId = history.subscriptionId;
    dto.planId = history.planId;
    dto.action = history.action;
    dto.performedAt = history.performedAt;
    dto.previousPlanId = history.previousPlanId;
    dto.notes = history.notes;
    dto.performedBy = history.performedBy;
    return dto;
  }

  toSettingsDto(record: any): TenantSettingsDto {
    const delivery = new DeliverySettingsDto();
    delivery.requireOtp = record.require_otp;
    delivery.requireSignature = record.require_signature;
    delivery.requireProofPhoto = record.require_proof_photo;
    delivery.requireIdPhoto = record.require_id_photo;
    delivery.allowRepresentative = record.allow_representative;

    const operational = new OperationalSettingsDto();
    operational.trackingPrefix = record.tracking_prefix || null;
    operational.autoCloseShipmentAfterCollection =
      record.auto_close_shipment_after_collection;
    operational.allowShipmentReopen = record.allow_shipment_reopen;
    operational.allowTripCancellationAfterLoading =
      record.allow_trip_cancellation_after_loading;
    operational.requireManagerBeforeTripDeparture =
      record.require_manager_before_trip_departure;
    operational.allowReturnAfterCollection =
      record.allow_return_after_collection;
    operational.requireSenderNationalId = record.require_sender_national_id;
    operational.quotationValidityHours = record.quotation_validity_hours;

    const pricing = new PricingSettingsDto();
    pricing.volumetricDivisor = record.volumetric_divisor;
    pricing.defaultCurrency = record.default_currency;

    const dto = new TenantSettingsDto();
    dto.tenantId = record.tenantId || record.id;
    dto.delivery = delivery;
    dto.operational = operational;
    dto.pricing = pricing;
    return dto;
  }

  toPricingSettingsDto(record: any): any {
    return {
      tenantId: record.tenantId || record.id,
      volumetricDivisor: record.volumetric_divisor,
      defaultCurrency: record.default_currency,
    };
  }
}
