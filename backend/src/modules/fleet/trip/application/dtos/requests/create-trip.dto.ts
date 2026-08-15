import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateTripDto {
  @ApiProperty({
    description: 'Employee (driver) operating this trip',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  driverId: string;

  @ApiProperty({
    description: 'Organization unit the trip departs from',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  originOrgUnitId: string;

  @ApiProperty({
    description: 'Organization unit the trip arrives at',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  destinationOrgUnitId: string;

  @ApiPropertyOptional({ description: 'Planned departure time' })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  scheduledAt?: Date;

  @ApiPropertyOptional({ description: 'Free-form operational notes' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description:
      'IDs of READY_FOR_DISPATCH manifests to attach to this trip at creation time',
    type: [String],
    format: 'uuid',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  manifestIds?: string[];
}
