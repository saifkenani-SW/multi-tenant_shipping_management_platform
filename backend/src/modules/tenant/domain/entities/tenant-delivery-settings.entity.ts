export class TenantDeliverySettings {
  constructor(
    public readonly tenantId: string,
    public readonly requireOtp: boolean = true,
    public readonly requireSignature: boolean = true,
    public readonly requireProofPhoto: boolean = true,
    public readonly requireIdPhoto: boolean = false,
    public readonly allowRepresentative: boolean = true,
  ) {}
}
