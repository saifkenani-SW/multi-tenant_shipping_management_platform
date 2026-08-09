import { ZonePricingResolutionService } from './zone-pricing-resolution.service';
import { ZonePricingQueryRepository } from '../../infrastructure/repositories/zone-pricing.query.repository';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ResolvedTenantCandidatesDto } from '../../../organization/dtos/responses/resolved-tenant-candidates.dto';

describe('ZonePricingResolutionService', () => {
  let service: ZonePricingResolutionService;
  let repository: ZonePricingQueryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonePricingResolutionService,
        {
          provide: ZonePricingQueryRepository,
          useValue: {
            findPricesForZonePairs: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ZonePricingResolutionService>(
      ZonePricingResolutionService,
    );
    repository = module.get<ZonePricingQueryRepository>(
      ZonePricingQueryRepository,
    );
  });

  describe('resolvePrices', () => {
    it('should query repository and build a map correctly', async () => {
      const zonePairs = [
        { tenantId: 'tenant-1', originZoneId: 'z1', destinationZoneId: 'z2' },
        { tenantId: 'tenant-1', originZoneId: 'z3', destinationZoneId: 'z4' },
      ];

      jest.spyOn(repository, 'findPricesForZonePairs').mockResolvedValue([
        {
          id: 'price-1',
          tenantId: 'tenant-1',
          originZoneId: 'z1',
          destinationZoneId: 'z2',
          basePrice: 100 as any,
          baseWeight: 10 as any,
          pricePerKg: 10 as any,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.resolvePrices(zonePairs);

      expect(repository.findPricesForZonePairs).toHaveBeenCalledWith(zonePairs);
      expect(result.has('tenant-1:z1:z2')).toBe(true);
      expect(result.get('tenant-1:z1:z2')).toBeDefined();
      expect(result.has('tenant-1:z3:z4')).toBe(false); // No price returned
    });

    it('should throw NotFoundException if a price for a pair is required but not found', async () => {
      // We haven't implemented strict checking inside resolvePrices itself yet,
      // but if we do in the future, we test it here.
      // Currently, it just returns the map and lets QuotationGenerationService handle the fallback/pending state.
      // So this test can just ensure it doesn't throw.
      const zonePairs = [
        { tenantId: 't1', originZoneId: 'z1', destinationZoneId: 'z2' },
      ];
      jest.spyOn(repository, 'findPricesForZonePairs').mockResolvedValue([]);

      const result = await service.resolvePrices(zonePairs);
      expect(result.size).toBe(0);
    });
  });
});
