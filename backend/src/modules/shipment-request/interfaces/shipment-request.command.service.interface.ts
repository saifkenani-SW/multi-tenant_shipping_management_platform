import { CreateShipmentRequestDto } from '../dtos/requests/create-shipment-request.dto';
import { RejectShipmentRequestDto } from '../dtos/requests/reject-shipment-request.dto';
import { CancelShipmentRequestDto } from '../dtos/requests/cancel-shipment-request.dto';

export interface IShipmentRequestCommandService {
  createRequest(
    userId: string,
    dto: CreateShipmentRequestDto,
  ): Promise<{ id: string }>;
  approveQuotation(
    userId: string,
    shipmentRequestId: string,
    quotationId: string,
  ): Promise<void>;
  acceptByEmployee(
    employeeUserId: string,
    shipmentRequestId: string,
  ): Promise<void>;
  reject(
    employeeUserId: string,
    shipmentRequestId: string,
    dto: RejectShipmentRequestDto,
  ): Promise<void>;
  cancel(
    userId: string,
    shipmentRequestId: string,
    dto: CancelShipmentRequestDto,
  ): Promise<void>;
}
