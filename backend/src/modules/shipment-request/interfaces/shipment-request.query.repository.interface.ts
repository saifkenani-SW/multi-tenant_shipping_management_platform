import { RequestStatus } from '@prisma/client';
import { ShipmentRequest } from '../domain/shipment-request.entity';
import { Quotation } from '../domain/quotation.entity';

export interface IShipmentRequestQueryRepository {
  findManyForCustomer(
    customerProfileId: string,
    skip: number,
    take: number,
    status?: RequestStatus,
  ): Promise<[ShipmentRequest[], number]>;

  /** بترجع بس الطلبات يلي فرعها الأساسي أو الوجهة من ضمن orgUnitIds */
  findManyForEmployee(
    orgUnitIds: string[],
    skip: number,
    take: number,
    status?: RequestStatus,
  ): Promise<[ShipmentRequest[], number]>;

  findById(id: string): Promise<ShipmentRequest | null>;

  findQuotationsByRequestId(shipmentRequestId: string): Promise<Quotation[]>;
}
