import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LocationType } from '@prisma/client';
import { LocationPointDto } from './location-point.dto';

export class CreateGlobalLocationDto {
  @ApiProperty({ example: 'New York', description: 'Name of the location' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: LocationType, description: 'Type of the location' })
  @IsEnum(LocationType)
  type: LocationType;

  @ApiPropertyOptional({ example: 'uuid', description: 'Parent location ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({
    type: LocationPointDto,
    description: 'Geographical coordinates',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationPointDto)
  location?: LocationPointDto;
}
