import { ApiProperty } from '@nestjs/swagger';
import { ShipmentRequestResponseDto } from './shipment-request.response.dto';
import { QuotationResponseDto } from '../../../../quotation/application/dtos/responses/quotation.response.dto';

export { QuotationResponseDto };

export class ShipmentRequestDetailsResponseDto extends ShipmentRequestResponseDto {
  @ApiProperty({ type: [QuotationResponseDto] })
  quotations: QuotationResponseDto[];
}
