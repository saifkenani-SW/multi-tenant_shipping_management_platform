import { PricingCalculationService } from './pricing-calculation.service';
import { CreateShipmentRequestDto } from '../../../request/application/dtos/requests/create-shipment-request.dto';
import { Decimal } from 'decimal.js';

describe('PricingCalculationService', () => {
  let service: PricingCalculationService;

  beforeEach(() => {
    service = new PricingCalculationService();
  });

  describe('calculateVolumetricWeight', () => {
    it('should return 0 if dimensions are missing', () => {
      expect(service.calculateVolumetricWeight(undefined, 10, 10)).toBe(0);
      expect(service.calculateVolumetricWeight(10, undefined, 10)).toBe(0);
      expect(service.calculateVolumetricWeight(10, 10, undefined)).toBe(0);
    });

    it('should calculate volumetric weight correctly with default divider', () => {
      // 50 * 50 * 50 / 5000 = 25
      expect(service.calculateVolumetricWeight(50, 50, 50, 5000)).toBe(25);
    });

    it('should calculate volumetric weight correctly with custom divider', () => {
      // 50 * 50 * 50 / 4000 = 31.25
      expect(service.calculateVolumetricWeight(50, 50, 50, 4000)).toBe(31.25);
    });
  });

  describe('calculateChargeableWeight', () => {
    it('should return actual weight if volumetric weight is 0', () => {
      expect(service.calculateChargeableWeight(10, 0)).toBe(10);
    });

    it('should return actual weight if it is greater than volumetric weight', () => {
      expect(service.calculateChargeableWeight(15, 10)).toBe(15);
    });

    it('should return volumetric weight if it is greater than actual weight', () => {
      expect(service.calculateChargeableWeight(10, 15)).toBe(15);
    });
  });

  describe('calculateQuotationAmount', () => {
    it('should correctly calculate total amount with basic values', () => {
      const result = service.calculateQuotationAmount(
        15, // actualWeightKg
        0,
        0,
        0, // lengthCm, widthCm, heightCm
        5000, // volumetricDivisor
        100, // basePrice
        10, // baseWeightKg
        10, // pricePerExtraKg
        50, // extraFees
      );

      // base: 100
      // extra weight: 5kg * 10 = 50
      // extra fees: 50
      // total: 200

      expect(result.totalAmount).toBe(200);
      expect(result.weightCharge).toBe(50);
    });

    it('should correctly calculate total amount when chargeable weight is less than or equal to base weight', () => {
      const result = service.calculateQuotationAmount(
        8, // actualWeightKg
        0,
        0,
        0,
        5000,
        100, // basePrice
        10, // baseWeightKg
        10, // pricePerExtraKg
        0, // extraFees
      );

      expect(result.totalAmount).toBe(100);
      expect(result.weightCharge).toBe(0);
    });
  });
});
