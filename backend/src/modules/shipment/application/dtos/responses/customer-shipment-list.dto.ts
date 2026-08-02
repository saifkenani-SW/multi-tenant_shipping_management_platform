import { ApiProperty } from '@nestjs/swagger';
import { CursorPaginatedResponse } from '../../../../../common/pagination/cursor/responses/cursor-paginated-response';
import { CustomerShipmentDetailsDto } from './customer-shipment-details.dto';

export class CustomerShipmentListDto extends CursorPaginatedResponse<CustomerShipmentDetailsDto> {
  @ApiProperty({
    type: [CustomerShipmentDetailsDto],
    description: 'Array of customer shipments for the current page',
  })
  declare readonly data: CustomerShipmentDetailsDto[];
}
