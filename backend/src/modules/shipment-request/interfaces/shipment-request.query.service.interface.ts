import { ShipmentRequestQueryDto } from '../dtos/requests/shipment-request-query.dto';
import { PaginatedShipmentRequestListDto } from '../dtos/responses/shipment-request-list.dto';
import { ShipmentRequestDetailsDto } from '../dtos/responses/shipment-request-details.dto';
import { QuotationListItemDto } from '../dtos/responses/quotation-list-item.dto';

export interface IShipmentRequestQueryService {
  findRequestsForCustomer(
    userId: string,
    query: ShipmentRequestQueryDto,
  ): Promise<PaginatedShipmentRequestListDto>;

  findRequestsForEmployee(
    employeeUserId: string,
    tenantId: string,
    query: ShipmentRequestQueryDto,
  ): Promise<PaginatedShipmentRequestListDto>;

  getRequestDetailsForCustomer(
    userId: string,
    shipmentRequestId: string,
  ): Promise<ShipmentRequestDetailsDto>;

  getRequestDetailsForEmployee(
    employeeUserId: string,
    tenantId: string,
    shipmentRequestId: string,
  ): Promise<ShipmentRequestDetailsDto>;

  getQuotationsForCustomer(
    userId: string,
    shipmentRequestId: string,
  ): Promise<QuotationListItemDto[]>;
}
