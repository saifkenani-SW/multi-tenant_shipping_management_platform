import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentRequestDto {
  @ApiPropertyOptional({
    description: 'The target tenant ID if applicable',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  target_tenant_id?: string;

  @ApiProperty({
    description: 'The global location ID of the origin',
    example: '00000000-0000-7000-8000-000000000043',
  })
  @IsUUID()
  @IsNotEmpty()
  origin_global_location_id: string;

  @ApiProperty({
    description: 'The global location ID of the destination',
    example: '00000000-0000-7000-8000-000000000049',
  })
  @IsUUID()
  @IsNotEmpty()
  destination_global_location_id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  sender_name: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  sender_phone: string;

  @ApiPropertyOptional({ example: 24.7136 })
  @IsNumber()
  @IsOptional()
  sender_lat?: number;

  @ApiPropertyOptional({ example: 46.6753 })
  @IsNumber()
  @IsOptional()
  sender_lng?: number;

  @ApiProperty({ example: 'Jane Smith' })
  @IsString()
  @IsNotEmpty()
  receiver_name: string;

  @ApiProperty({ example: '+0987654321' })
  @IsString()
  @IsNotEmpty()
  receiver_phone: string;

  @ApiPropertyOptional({ example: 24.7136 })
  @IsNumber()
  @IsOptional()
  receiver_lat?: number;

  @ApiPropertyOptional({ example: 46.6753 })
  @IsNumber()
  @IsOptional()
  receiver_lng?: number;

  @ApiProperty({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  expected_pieces_count: number;

  @ApiProperty({ example: 5.5 })
  @IsNumber()
  @Min(0.1)
  @IsNotEmpty()
  expected_total_weight_kg: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  expected_length_cm: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  expected_width_cm: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  expected_height_cm: number;

  @ApiPropertyOptional({ example: 'Handle with care' })
  @IsString()
  @IsOptional()
  notes?: string;
}
