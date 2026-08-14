import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActionType, ParcelCondition, ParcelStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UpdateParcelStatusDto {
  @ApiProperty({ enum: ParcelStatus, description: 'New parcel status' })
  @IsEnum(ParcelStatus)
  @IsNotEmpty()
  status: ParcelStatus;

  @ApiPropertyOptional({
    enum: ParcelCondition,
    description: 'New condition. Independent of the status lifecycle.',
  })
  @IsEnum(ParcelCondition)
  @IsOptional()
  condition?: ParcelCondition;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}
