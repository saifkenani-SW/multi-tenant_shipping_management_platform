import { PaymentResponsibility } from '../enums/payment-responsibility.enum';
import { ShipmentStatus } from '../enums/shipment-status.enum';

import { Parcel } from './parcel.entity';

export class CustomerShipmentEntity {
  id: string;
  readonly tenantId: string;
  readonly senderCustomerProfileId: string;
  readonly receiverCustomerProfileId?: string;
  readonly shipmentRequestId?: string | null;
  approvedQuotationId?: string | null;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  paymentResponsibility: PaymentResponsibility;
  totalChargeableWeightKg: number;
  status: ShipmentStatus;
  parcels: Parcel[] = [];
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CustomerShipmentEntity>) {
    Object.assign(this, partial);
    if (!this.parcels) {
      this.parcels = [];
    }
  }

  calculateTotalChargeableWeight(): void {
    if (!this.parcels || this.parcels.length === 0) {
      this.totalChargeableWeightKg = 0;
      return;
    }
    
    this.totalChargeableWeightKg = this.parcels.reduce((sum, parcel) => {
      const chargeable = Math.max(parcel.actualWeightKg, parcel.volumetricWeightKg || 0);
      return sum + chargeable;
    }, 0);
  }
}
