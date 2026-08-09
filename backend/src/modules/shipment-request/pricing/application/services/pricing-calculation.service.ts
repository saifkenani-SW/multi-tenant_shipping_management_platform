import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingCalculationService {
  /**
   * Calculates the volumetric weight of a shipment
   */
  calculateVolumetricWeight(
    lengthCm: number,
    widthCm: number,
    heightCm: number,
    volumetricDivisor: number,
  ): number {
    if (!volumetricDivisor || volumetricDivisor <= 0) return 0;
    return (lengthCm * widthCm * heightCm) / volumetricDivisor;
  }

  /**
   * Determines the chargeable weight (MAX of actual and volumetric)
   */
  calculateChargeableWeight(
    actualWeightKg: number,
    volumetricWeightKg: number,
  ): number {
    return Math.max(actualWeightKg, volumetricWeightKg);
  }

  /**
   * Calculates the additional weight to be charged
   */
  calculateAdditionalWeight(
    chargeableWeightKg: number,
    baseWeightKg: number,
  ): number {
    return Math.max(0, chargeableWeightKg - baseWeightKg);
  }

  /**
   * Calculates the total amount for the weight charge
   */
  calculateWeightCharge(
    additionalWeightKg: number,
    pricePerExtraKg: number,
  ): number {
    return additionalWeightKg * pricePerExtraKg;
  }

  /**
   * Calculates the total quotation amount
   */
  calculateTotalAmount(
    basePrice: number,
    weightCharge: number,
    extraFees: number = 0,
  ): number {
    return basePrice + weightCharge + extraFees;
  }

  /**
   * Convenience method to calculate the full quotation from scratch
   */
  calculateQuotationAmount(
    actualWeightKg: number,
    lengthCm: number,
    widthCm: number,
    heightCm: number,
    volumetricDivisor: number,
    basePrice: number,
    baseWeightKg: number,
    pricePerExtraKg: number,
    extraFees: number = 0,
  ): {
    volumetricWeightKg: number;
    chargeableWeightKg: number;
    additionalWeightKg: number;
    weightCharge: number;
    totalAmount: number;
  } {
    const volumetricWeightKg = this.calculateVolumetricWeight(
      lengthCm,
      widthCm,
      heightCm,
      volumetricDivisor,
    );

    const chargeableWeightKg = this.calculateChargeableWeight(
      actualWeightKg,
      volumetricWeightKg,
    );

    const additionalWeightKg = this.calculateAdditionalWeight(
      chargeableWeightKg,
      baseWeightKg,
    );

    const weightCharge = this.calculateWeightCharge(
      additionalWeightKg,
      pricePerExtraKg,
    );

    const totalAmount = this.calculateTotalAmount(
      basePrice,
      weightCharge,
      extraFees,
    );

    return {
      volumetricWeightKg,
      chargeableWeightKg,
      additionalWeightKg,
      weightCharge,
      totalAmount,
    };
  }
}
