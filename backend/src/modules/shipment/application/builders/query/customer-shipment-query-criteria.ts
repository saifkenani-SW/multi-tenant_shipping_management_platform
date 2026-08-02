import { ShipmentStatus } from '../../../domain/enums/shipment-status.enum';

import { CursorPagination } from '../../../../../common/pagination/cursor/value-objects/cursor-pagination';

export class CustomerShipmentQueryCriteria {
  public pagination: CursorPagination;
  public tenantId?: string;
  public senderCustomerProfileId?: string;
  public receiverCustomerProfileId?: string;
  public status?: ShipmentStatus;
  public search?: string;
}
