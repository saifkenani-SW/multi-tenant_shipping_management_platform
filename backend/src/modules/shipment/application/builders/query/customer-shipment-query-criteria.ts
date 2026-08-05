import { CursorPagination } from 'src/common/pagination';
import { ShipmentStatus } from '../../../domain/enums/shipment-status.enum';


export class CustomerShipmentQueryCriteria {
  public pagination: CursorPagination;
  public tenantId?: string;
  public senderCustomerProfileId?: string;
  public receiverCustomerProfileId?: string;
  public status?: ShipmentStatus;
  public search?: string;
}
