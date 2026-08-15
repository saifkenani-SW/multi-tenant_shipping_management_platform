import { Test, TestingModule } from '@nestjs/testing';
import { TenantFacade } from './tenant.facade';
import { TenantQueryService } from '../services/tenant.query.service';
import { TenantSettingsDto } from '../dtos/responses/tenant-settings.dto';

jest.mock('../../../../common/uuid/uuid.helper', () => ({
  generateUuid: jest.fn(() => 'test-uuid'),
}));

describe('TenantFacade', () => {
  let facade: TenantFacade;
  let tenantQueryService: jest.Mocked<TenantQueryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantFacade,
        {
          provide: TenantQueryService,
          useValue: {
            getTenantPricingSettingsBatch: jest.fn(),
            getTenantSettings: jest.fn(),
            isTenantOwner: jest.fn(),
            getTenantSubscription: jest.fn(),
          },
        },
      ],
    }).compile();

    facade = module.get<TenantFacade>(TenantFacade);
    tenantQueryService = module.get(TenantQueryService);
  });

  describe('getTenantPricingSettingsBatch', () => {
    it('returns a Map keyed by tenant ID and dedups input IDs before querying', async () => {
      const mockSettings = [
        {
          tenantId: 'tenant-1',
          volumetricDivisor: 5000,
          defaultCurrency: 'SY',
        },
        {
          tenantId: 'tenant-2',
          volumetricDivisor: 4000,
          defaultCurrency: 'USD',
        },
      ];

      tenantQueryService.getTenantPricingSettingsBatch.mockResolvedValue(
        mockSettings as any,
      );

      const tenantIds = ['tenant-1', 'tenant-1', 'tenant-2'];
      const result = await facade.getTenantPricingSettingsBatch(tenantIds);

      expect(
        tenantQueryService.getTenantPricingSettingsBatch,
      ).toHaveBeenCalledTimes(1);
      expect(
        tenantQueryService.getTenantPricingSettingsBatch,
      ).toHaveBeenCalledWith(['tenant-1', 'tenant-2']); // Deduplicated

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('tenant-1')).toEqual({
        tenantId: 'tenant-1',
        volumetricDivisor: 5000,
        defaultCurrency: 'SY',
      });
      expect(result.get('tenant-2')).toEqual({
        tenantId: 'tenant-2',
        volumetricDivisor: 4000,
        defaultCurrency: 'USD',
      });
    });

    it('returns an empty map if no IDs are provided', async () => {
      const result = await facade.getTenantPricingSettingsBatch([]);
      expect(result.size).toBe(0);
      expect(
        tenantQueryService.getTenantPricingSettingsBatch,
      ).not.toHaveBeenCalled();
    });
  });
});
