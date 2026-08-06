import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTenantZoneDto {
  @ApiProperty({ description: 'Name of the tenant zone' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ description: 'Description of the tenant zone' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Active status of the tenant zone',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
