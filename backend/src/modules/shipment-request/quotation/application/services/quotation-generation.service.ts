import { Injectable } from '@nestjs/common';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { ZonePricingResolutionService } from '../../../pricing/application/services/zone-pricing-resolution.service';
import { PricingCalculationService } from '../../../pricing/application/services/pricing-calculation.service';
import { CreateShipmentRequestDto } from '../../../request/application/dtos/requests/create-shipment-request.dto';
import { generateUuid } from '../../../../../common/uuid/uuid.helper';
import { resolveCurrency } from '../../../../billing/constants/billing.constants';

export enum QuotationStatus {
  PENDING = 'PENDING',
  WAITING_PRICING_REQUEST = 'WAITING_PRICING_REQUEST',
  WAITING_PRICING = 'WAITING_PRICING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface GeneratedQuotation {
  id: string;
  tenantId: string;
  tenantName?: string;
  shipmentRequestId: string;
  originOrgUnitId: string;
  originOrgUnitName?: string;
  destinationOrgUnitId: string;
  destinationOrgUnitName?: string;
  serviceLevel: string;
  quotationType: 'AUTOMATIC' | 'MANUAL';
  basePrice: number | null;
  weightCharge: number | null;
  extraFees: number | null;
  amount: number | null;
  currency: string;
  pricingSnapshot: Record<string, any> | null;
  validUntil: Date | null;
  status: QuotationStatus;
  notes?: string;
}

@Injectable()
export class QuotationGenerationService {
  constructor(
    private readonly organizationFacade: OrganizationFacade,
    private readonly tenantFacade: TenantFacade,
    private readonly zonePricingResolution: ZonePricingResolutionService,
    private readonly pricingCalculation: PricingCalculationService,
  ) {}

  async generateQuotations(
    requestDto: CreateShipmentRequestDto,
    shipmentRequestId: string,
  ): Promise<GeneratedQuotation[]> {
    const {
      origin_global_location_id,
      destination_global_location_id,
      target_tenant_id,
      expected_total_weight_kg,
      expected_length_cm,
      expected_width_cm,
      expected_height_cm,
    } = requestDto;

    // 1. Resolve candidates from Organization Module
    const candidates = await this.organizationFacade.resolveRoutesForLocations(
      origin_global_location_id,
      destination_global_location_id,
      target_tenant_id,
    );

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // 2. Extract Zone Pairs to query
    const zonePairs: {
      tenantId: string;
      originZoneId: string;
      destinationZoneId: string;
    }[] = [];
    const routeCombinations: {
      tenantId: string;
      tenantName?: string;
      originOrgUnitId: string;
      originOrgUnitName?: string;
      destinationOrgUnitId: string;
      destinationOrgUnitName?: string;
      originZoneId: string;
      destinationZoneId: string;
    }[] = [];

    for (const tenant of candidates) {
      for (const origin of tenant.originCandidates) {
        for (const dest of tenant.destinationCandidates) {
          if (origin.zoneId && dest.zoneId) {
            zonePairs.push({
              tenantId: tenant.tenantId,
              originZoneId: origin.zoneId,
              destinationZoneId: dest.zoneId,
            });

            routeCombinations.push({
              tenantId: tenant.tenantId,
              tenantName: tenant.tenantName,
              originOrgUnitId: origin.orgUnitId,
              originOrgUnitName: origin.orgUnitName,
              destinationOrgUnitId: dest.orgUnitId,
              destinationOrgUnitName: dest.orgUnitName,
              originZoneId: origin.zoneId,
              destinationZoneId: dest.zoneId,
            });
          }
        }
      }
    }

    // Remove duplicates from zonePairs for efficient query
    const uniqueZonePairs = Array.from(
      new Set(zonePairs.map((p) => JSON.stringify(p))),
    ).map((p) => JSON.parse(p));

    // 3. Resolve Pricing Matrices in ONE query
    const pricingMap =
      await this.zonePricingResolution.resolvePrices(uniqueZonePairs);

    // 4. Batch Fetch Tenant Settings
    const uniqueTenantIds = [
      ...new Set(routeCombinations.map((r) => r.tenantId)),
    ];
    const settingsMap =
      await this.tenantFacade.getTenantPricingSettingsBatch(uniqueTenantIds);

    // 5. Generate Quotations
    const quotations: GeneratedQuotation[] = [];

    for (const route of routeCombinations) {
      if (!settingsMap.has(route.tenantId)) {
        // Tenant is inactive or not found, skip completely.
        continue;
      }

      // Get settings for the tenant
      const settings = settingsMap.get(route.tenantId);
      const volumetricDivisor = settings?.volumetricDivisor || 5000;
      const currency = resolveCurrency(settings?.defaultCurrency);

      const key = `${route.tenantId}:${route.originZoneId}:${route.destinationZoneId}`;
      const pricingList = pricingMap.get(key) || [];

      if (pricingList.length === 0) {
        // No pricing matrix found for this route. The user states this means they do not support this route currently.
        continue;
      }

      for (const pricing of pricingList) {
        // Check if volumetric divisor is valid. If not, it means they support the route but we can't calculate automatically right now.
        if (
          !settings ||
          !settings.volumetricDivisor ||
          settings.volumetricDivisor === 0
        ) {
          quotations.push({
            id: generateUuid(),
            tenantId: route.tenantId,
            tenantName: route.tenantName,
            shipmentRequestId,
            originOrgUnitId: route.originOrgUnitId,
            originOrgUnitName: route.originOrgUnitName,
            destinationOrgUnitId: route.destinationOrgUnitId,
            destinationOrgUnitName: route.destinationOrgUnitName,
            serviceLevel: pricing.serviceLevel,
            quotationType: 'MANUAL',
            basePrice: null,
            weightCharge: null,
            extraFees: null,
            amount: null,
            currency,
            pricingSnapshot: null,
            validUntil: null,
            status: QuotationStatus.WAITING_PRICING_REQUEST,
            notes: 'Tenant volumetric settings are missing or divisor is zero',
          });
        } else {
          const calcResult = this.pricingCalculation.calculateQuotationAmount(
            expected_total_weight_kg,
            expected_length_cm,
            expected_width_cm,
            expected_height_cm,
            settings.volumetricDivisor,
            pricing.basePrice,
            pricing.baseWeightKg,
            pricing.pricePerExtraKg,
            0, // extraFees
          );

          quotations.push({
            id: generateUuid(),
            tenantId: route.tenantId,
            tenantName: route.tenantName,
            shipmentRequestId,
            originOrgUnitId: route.originOrgUnitId,
            originOrgUnitName: route.originOrgUnitName,
            destinationOrgUnitId: route.destinationOrgUnitId,
            destinationOrgUnitName: route.destinationOrgUnitName,
            serviceLevel: pricing.serviceLevel,
            quotationType: 'AUTOMATIC',
            basePrice: pricing.basePrice,
            weightCharge: calcResult.weightCharge,
            extraFees: 0,
            amount: calcResult.totalAmount,
            currency,
            pricingSnapshot: {
              expectedTotalWeightKg: expected_total_weight_kg,
              expectedLengthCm: expected_length_cm,
              expectedWidthCm: expected_width_cm,
              expectedHeightCm: expected_height_cm,
              volumetricDivisor: settings.volumetricDivisor,
              basePrice: pricing.basePrice,
              baseWeightKg: pricing.baseWeightKg,
              pricePerExtraKg: pricing.pricePerExtraKg,
              calculatedVolumetricWeightKg: calcResult.volumetricWeightKg,
              calculatedChargeableWeightKg: calcResult.chargeableWeightKg,
            },
            validUntil: null, // Will be set during persistence using Operational Settings
            status: QuotationStatus.PENDING,
          });
        }
      }
    }

    return quotations;
  }
}
