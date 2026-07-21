import { RequestStatus } from '@prisma/client';
import { ShipmentRequest } from '../domain/shipment-request.entity';
import { Quotation } from '../domain/quotation.entity';

export interface IShipmentRequestQueryRepository {
  findCustomerProfileIdByUserId(userId: string): Promise<string | null>;

  findManyForCustomer(
    customerProfileId: string,
    skip: number,
    take: number,
    status?: RequestStatus,
  ): Promise<[ShipmentRequest[], number]>;

  findManyForEmployee(
    tenantId: string,
    skip: number,
    take: number,
    status?: RequestStatus,
  ): Promise<[ShipmentRequest[], number]>;

  findById(id: string): Promise<ShipmentRequest | null>;

  findQuotationsByRequestId(shipmentRequestId: string): Promise<Quotation[]>;
}
