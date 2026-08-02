import { Injectable } from '@nestjs/common';
import { TransactionalPrismaService } from '../../../../packages/transaction';
import { TenantDeliverySettings } from '../../domain/entities/tenant-delivery-settings.entity';
import { TenantOperationalSettings } from '../../domain/entities/tenant-operational-settings.entity';
import { TenantPricingSettings } from '../../domain/entities/tenant-pricing-settings.entity';

@Injectable()
export class TenantSettingsCommandRepository {
  constructor(private readonly prisma: TransactionalPrismaService) {}

  async upsertDeliverySettings(
    settings: TenantDeliverySettings,
  ): Promise<void> {
    await this.prisma.client.tenant_delivery_settings.upsert({
      where: { tenant_id: settings.tenantId },
      create: {
        tenant_id: settings.tenantId,
        require_otp: settings.requireOtp,
        require_signature: settings.requireSignature,
        require_proof_photo: settings.requireProofPhoto,
        require_id_photo: settings.requireIdPhoto,
        allow_representative: settings.allowRepresentative,
      },
      update: {
        require_otp: settings.requireOtp,
        require_signature: settings.requireSignature,
        require_proof_photo: settings.requireProofPhoto,
        require_id_photo: settings.requireIdPhoto,
        allow_representative: settings.allowRepresentative,
      },
    });
  }

  async updateDeliverySettings(
    tenantId: string,
    payload: Partial<TenantDeliverySettings>,
  ): Promise<void> {
    await this.prisma.client.tenant_delivery_settings.update({
      where: { tenant_id: tenantId },
      data: {
        require_otp: payload.requireOtp,
        require_signature: payload.requireSignature,
        require_proof_photo: payload.requireProofPhoto,
        require_id_photo: payload.requireIdPhoto,
        allow_representative: payload.allowRepresentative,
      },
    });
  }

  async upsertOperationalSettings(
    settings: TenantOperationalSettings,
  ): Promise<void> {
    await this.prisma.client.tenant_operational_settings.upsert({
      where: { tenant_id: settings.tenantId },
      create: {
        tenant_id: settings.tenantId,
        tracking_prefix: settings.trackingPrefix,
        auto_close_shipment_after_collection:
          settings.autoCloseShipmentAfterCollection,
        allow_shipment_reopen: settings.allowShipmentReopen,
        allow_trip_cancellation_after_loading:
          settings.allowTripCancellationAfterLoading,
        require_manager_before_trip_departure:
          settings.requireManagerBeforeTripDeparture,
        allow_return_after_collection: settings.allowReturnAfterCollection,
        quotation_validity_hours: settings.quotationValidityHours,
      },
      update: {
        tracking_prefix: settings.trackingPrefix,
        auto_close_shipment_after_collection:
          settings.autoCloseShipmentAfterCollection,
        allow_shipment_reopen: settings.allowShipmentReopen,
        allow_trip_cancellation_after_loading:
          settings.allowTripCancellationAfterLoading,
        require_manager_before_trip_departure:
          settings.requireManagerBeforeTripDeparture,
        allow_return_after_collection: settings.allowReturnAfterCollection,
        quotation_validity_hours: settings.quotationValidityHours,
      },
    });
  }

  async updateOperationalSettings(
    tenantId: string,
    payload: Partial<TenantOperationalSettings>,
  ): Promise<void> {
    await this.prisma.client.tenant_operational_settings.update({
      where: { tenant_id: tenantId },
      data: {
        tracking_prefix: payload.trackingPrefix,
        auto_close_shipment_after_collection:
          payload.autoCloseShipmentAfterCollection,
        allow_shipment_reopen: payload.allowShipmentReopen,
        allow_trip_cancellation_after_loading:
          payload.allowTripCancellationAfterLoading,
        require_manager_before_trip_departure:
          payload.requireManagerBeforeTripDeparture,
        allow_return_after_collection: payload.allowReturnAfterCollection,
        quotation_validity_hours: payload.quotationValidityHours,
      },
    });
  }

  async upsertPricingSettings(settings: TenantPricingSettings): Promise<void> {
    await this.prisma.client.tenant_pricing_settings.upsert({
      where: { tenant_id: settings.tenantId },
      create: {
        tenant_id: settings.tenantId,
        volumetric_divisor: settings.volumetricDivisor,
        default_currency: settings.defaultCurrency,
      },
      update: {
        volumetric_divisor: settings.volumetricDivisor,
        default_currency: settings.defaultCurrency,
      },
    });
  }

  async updatePricingSettings(
    tenantId: string,
    payload: Partial<TenantPricingSettings>,
  ): Promise<void> {
    await this.prisma.client.tenant_pricing_settings.update({
      where: { tenant_id: tenantId },
      data: {
        volumetric_divisor: payload.volumetricDivisor,
        default_currency: payload.defaultCurrency,
      },
    });
  }

  async assignOwner(
    tenantId: string,
    userId: string,
    isPrimary = true,
  ): Promise<void> {
    await this.prisma.client.tenant_owner.create({
      data: {
        tenant_id: tenantId,
        user_id: userId,
        is_primary: isPrimary,
      },
    });
  }
}
