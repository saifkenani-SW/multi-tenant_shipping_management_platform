import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParcelResponseDto } from '../../../../parcel/application/dtos/responses/parcel.response.dto';
import { ShipmentResponseDto } from './shipment.response.dto';

export class ShipmentDetailsResponseDto extends ShipmentResponseDto {
  @ApiPropertyOptional({ nullable: true })
  senderNationalId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  shipmentRequestId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  approvedQuotationId?: string | null;

  @ApiProperty({ type: [ParcelResponseDto] })
  parcels: ParcelResponseDto[];
}
