import {
  QuotationGenerationService,
  QuotationStatus,
} from './quotation-generation.service';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationFacade } from '../../../../organization/facades/organization.facade';
import { TenantFacade } from '../../../../tenant/application/facades/tenant.facade';
import { ZonePricingResolutionService } from '../../../pricing/application/services/zone-pricing-resolution.service';
import { PricingCalculationService } from '../../../pricing/application/services/pricing-calculation.service';
import { CreateShipmentRequestDto } from '../../../request/application/dtos/requests/create-shipment-request.dto';
import { generateUuid } from '../../../../../common/uuid/uuid.helper';

jest.mock('../../../../../common/uuid/uuid.helper', () => ({
  generateUuid: jest.fn(() => 'test-uuid'),
}));

describe('QuotationGenerationService', () => {
  let service: QuotationGenerationService;
  let organizationFacade: jest.Mocked<OrganizationFacade>;
  let tenantFacade: jest.Mocked<TenantFacade>;
  let pricingResolutionService: jest.Mocked<ZonePricingResolutionService>;
  let pricingCalculationService: jest.Mocked<PricingCalculationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationGenerationService,
        {
          provide: OrganizationFacade,
          useValue: {
            resolveRoutesForLocations: jest.fn(),
          },
        },
        {
          provide: TenantFacade,
          useValue: {
            getTenantPricingSettingsBatch: jest.fn(),
          },
        },
        {
          provide: ZonePricingResolutionService,
          useValue: {
            resolvePrices: jest.fn(),
          },
        },
        {
          provide: PricingCalculationService,
          useValue: {
            calculateVolumetricWeight: jest.fn(),
            calculateChargeableWeight: jest.fn(),
            calculateQuotationAmount: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<QuotationGenerationService>(
      QuotationGenerationService,
    );
    organizationFacade = module.get(OrganizationFacade);
    tenantFacade = module.get(TenantFacade);
    pricingResolutionService = module.get(ZonePricingResolutionService);
    pricingCalculationService = module.get(PricingCalculationService);
  });

  describe('generateQuotations', () => {
    it('should generate PENDING quotations when prices are found', async () => {
      const dto = {
        origin_global_location_id: 'loc-origin',
        destination_global_location_id: 'loc-dest',
        target_tenant_id: 'tenant-1',
        expected_pieces_count: 1,
        expected_total_weight_kg: 10,
        expected_length_cm: 20,
        expected_width_cm: 20,
        expected_height_cm: 20,
      } as CreateShipmentRequestDto;

      organizationFacade.resolveRoutesForLocations.mockResolvedValue([
        {
          tenantId: 'tenant-1',
          originCandidates: [
            {
              orgUnitId: 'org-o-1',
              orgUnitName: 'O1',
              zoneId: 'zone-1',
              zoneName: 'Z1',
            },
          ],
          destinationCandidates: [
            {
              orgUnitId: 'org-d-1',
              orgUnitName: 'D1',
              zoneId: 'zone-2',
              zoneName: 'Z2',
            },
          ],
        },
      ]);

      const mockPriceMap = new Map();
      mockPriceMap.set('tenant-1:zone-1:zone-2', [
        {
          basePrice: 10,
          baseWeightKg: 5,
          pricePerExtraKg: 2,
          serviceLevel: 'STANDARD',
        } as any,
      ]);

      pricingResolutionService.resolvePrices.mockResolvedValue(mockPriceMap);
      
      const mockSettingsMap = new Map();
      mockSettingsMap.set('tenant-1', { volumetricDivisor: 5000 });
      tenantFacade.getTenantPricingSettingsBatch.mockResolvedValue(mockSettingsMap);

      pricingCalculationService.calculateVolumetricWeight.mockReturnValue(5);
      pricingCalculationService.calculateChargeableWeight.mockReturnValue(10);
      pricingCalculationService.calculateQuotationAmount.mockReturnValue({
        volumetricWeightKg: 5,
        chargeableWeightKg: 10,
        additionalWeightKg: 0,
        totalAmount: 100,
        weightCharge: 0,
      });

      const quotations = await service.generateQuotations(dto);

      expect(quotations.length).toBe(1);
      expect(quotations[0].status).toBe(QuotationStatus.PENDING);
      expect(quotations[0].amount).toBe(100);
      expect(quotations[0].originOrgUnitId).toBe('org-o-1');
      expect(quotations[0].destinationOrgUnitId).toBe('org-d-1');
      expect(quotations[0].tenantId).toBe('tenant-1');
      
      expect(tenantFacade.getTenantPricingSettingsBatch).toHaveBeenCalledTimes(1);
      expect(tenantFacade.getTenantPricingSettingsBatch).toHaveBeenCalledWith(['tenant-1']);
      
      expect(pricingCalculationService.calculateQuotationAmount).toHaveBeenCalledWith(
        10, // weight
        20, // length
        20, // width
        20, // height
        5000, // volumetricDivisor
        10, // basePrice
        5, // baseWeight
        2, // pricePerExtraKg
        0, // extraFees
      );
    });

    it('should NOT generate quotations when prices are missing (no route)', async () => {
      const dto = {
        origin_global_location_id: 'loc-origin',
        destination_global_location_id: 'loc-dest',
        expected_total_weight_kg: 10,
      } as CreateShipmentRequestDto;

      organizationFacade.resolveRoutesForLocations.mockResolvedValue([
        {
          tenantId: 'tenant-1',
          originCandidates: [
            {
              orgUnitId: 'org-o-1',
              orgUnitName: 'O1',
              zoneId: 'zone-1',
              zoneName: 'Z1',
            },
          ],
          destinationCandidates: [
            {
              orgUnitId: 'org-d-1',
              orgUnitName: 'D1',
              zoneId: 'zone-2',
              zoneName: 'Z2',
            },
          ],
        },
      ]);

      // Map is empty
      pricingResolutionService.resolvePrices.mockResolvedValue(new Map());
      tenantFacade.getTenantPricingSettingsBatch.mockResolvedValue(new Map());

      const quotations = await service.generateQuotations(dto);

      expect(quotations.length).toBe(0);
    });

    it('should generate WAITING_PRICING quotations when tenant has no volumetric divisor', async () => {
      const dto = {
        origin_global_location_id: 'loc-origin',
        destination_global_location_id: 'loc-dest',
        target_tenant_id: 'tenant-1',
        expected_total_weight_kg: 10,
        expected_length_cm: 20,
        expected_width_cm: 20,
        expected_height_cm: 20,
      } as CreateShipmentRequestDto;

      organizationFacade.resolveRoutesForLocations.mockResolvedValue([
        {
          tenantId: 'tenant-1',
          originCandidates: [
            {
              orgUnitId: 'org-o-1',
              orgUnitName: 'O1',
              zoneId: 'zone-1',
              zoneName: 'Z1',
            },
          ],
          destinationCandidates: [
            {
              orgUnitId: 'org-d-1',
              orgUnitName: 'D1',
              zoneId: 'zone-2',
              zoneName: 'Z2',
            },
          ],
        },
      ]);

      const mockPriceMap = new Map();
      mockPriceMap.set('tenant-1:zone-1:zone-2', [
        {
          basePrice: 10,
          baseWeightKg: 5,
          pricePerExtraKg: 2,
          serviceLevel: 'STANDARD',
        } as any,
      ]);

      pricingResolutionService.resolvePrices.mockResolvedValue(mockPriceMap);

      // Settings are missing (or divisor is 0)
      const mockSettingsMap = new Map();
      mockSettingsMap.set('tenant-1', { volumetricDivisor: 0 });
      tenantFacade.getTenantPricingSettingsBatch.mockResolvedValue(mockSettingsMap);

      const quotations = await service.generateQuotations(dto);

      expect(quotations.length).toBe(1);
      expect(quotations[0].status).toBe(QuotationStatus.WAITING_PRICING);
      expect(quotations[0].amount).toBeNull();
      expect(quotations[0].notes).toBe(
        'Tenant volumetric settings are missing or divisor is zero',
      );
    });
  });
});
