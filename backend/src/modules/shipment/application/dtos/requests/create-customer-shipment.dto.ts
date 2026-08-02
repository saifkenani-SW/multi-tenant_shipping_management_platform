import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { PaymentResponsibility } from '../../../domain/enums/payment-responsibility.enum';
import { Type } from 'class-transformer';
import { CreateParcelDto } from './create-parcel.dto';

export class CreateCustomerShipmentDto {
  @ApiProperty({ description: 'The UUID of the sender customer profile' })
  @IsUUID()
  @IsNotEmpty()
  senderCustomerProfileId: string;

  @ApiPropertyOptional({ description: 'The UUID of the receiver customer profile, if registered' })
  @IsUUID('7')
  @IsOptional()
  receiverCustomerProfileId?: string;

  @ApiPropertyOptional({ description: 'Optional ID of the originating shipment request' })
  @IsUUID('7')
  @IsOptional()
  shipmentRequestId?: string;

  @ApiPropertyOptional({ description: 'Optional ID of an approved quotation' })
  @IsUUID()
  @IsOptional()
  approvedQuotationId?: string;

  @ApiProperty({ description: 'Name of the receiver' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  receiverName: string;

  @ApiProperty({ description: 'Phone number of the receiver' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  receiverPhone: string;

  @ApiProperty({ description: 'Delivery address of the receiver' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  receiverAddress: string;

  @ApiProperty({
    enum: PaymentResponsibility,
    description: 'Who pays for the shipment',
    default: PaymentResponsibility.SENDER,
  })
  @IsEnum(PaymentResponsibility)
  paymentResponsibility: PaymentResponsibility;

  @ApiProperty({ type: [CreateParcelDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParcelDto)
  parcels: CreateParcelDto[];
}
