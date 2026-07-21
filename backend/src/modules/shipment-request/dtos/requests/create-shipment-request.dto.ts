import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateShipmentRequestDto {
  @ApiProperty({ example: 'Sara Ahmad' })
  @IsString()
  @IsNotEmpty()
  senderName!: string;

  @ApiProperty({ example: '0991234567' })
  @IsString()
  @IsNotEmpty()
  senderPhone!: string;

  @ApiProperty({ example: 'Damascus, Al-Mazzeh, Street 12' })
  @IsString()
  @IsNotEmpty()
  senderAddress!: string;

  @ApiPropertyOptional()
  @IsLatitude()
  @IsOptional()
  senderLat?: number;

  @ApiPropertyOptional()
  @IsLongitude()
  @IsOptional()
  senderLng?: number;

  @ApiProperty({ example: 'Khaled Omar' })
  @IsString()
  @IsNotEmpty()
  receiverName!: string;

  @ApiProperty({ example: '0999876543' })
  @IsString()
  @IsNotEmpty()
  receiverPhone!: string;

  @ApiProperty({ example: 'Aleppo, Al-Furqan, Street 5' })
  @IsString()
  @IsNotEmpty()
  receiverAddress!: string;

  @ApiPropertyOptional()
  @IsLatitude()
  @IsOptional()
  receiverLat?: number;

  @ApiPropertyOptional()
  @IsLongitude()
  @IsOptional()
  receiverLng?: number;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  expectedPiecesCount?: number = 1;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  expectedTotalWeightKg?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'Optional: request a specific company directly. Left empty, the request is open for any company to quote.',
  })
  @IsUUID('7')
  @IsOptional()
  targetTenantId?: string;
}
