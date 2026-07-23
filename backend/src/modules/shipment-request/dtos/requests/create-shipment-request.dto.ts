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

// إحداثيات المُرسِل والمُستلِم إجبارية — النظام بيحدد أقرب فرع (origin/destination)
// اعتماداً عليها، فبدونها ما فيه يحسب لأي فرع يوجّه الطلب.

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

  @ApiProperty()
  @IsLatitude()
  senderLat!: number;

  @ApiProperty()
  @IsLongitude()
  senderLng!: number;

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

  @ApiProperty()
  @IsLatitude()
  receiverLat!: number;

  @ApiProperty()
  @IsLongitude()
  receiverLng!: number;

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
