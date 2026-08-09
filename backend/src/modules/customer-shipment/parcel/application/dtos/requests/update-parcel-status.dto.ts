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

  @ApiProperty({
    enum: ActionType,
    description: 'Movement type recorded in the tracking history',
  })
  @IsEnum(ActionType)
  @IsNotEmpty()
  actionType: ActionType;

  @ApiPropertyOptional({ description: 'Organization unit where this happened' })
  @IsUUID()
  @IsOptional()
  organizationUnitId?: string;

  @ApiPropertyOptional({ description: 'Trip this movement belongs to' })
  @IsUUID()
  @IsOptional()
  tripId?: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;
}
