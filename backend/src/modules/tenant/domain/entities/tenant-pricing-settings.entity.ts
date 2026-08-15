import { Currency } from '@prisma/client';

export class TenantPricingSettings {
  constructor(
    public readonly tenantId: string,
    public readonly volumetricDivisor: number = 5000,
    public readonly defaultCurrency: Currency = Currency.SY,
  ) {}
}
