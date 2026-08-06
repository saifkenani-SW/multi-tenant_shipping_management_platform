import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { OrgUnitLocationMappingDto } from './create-organization-unit.dto';

export class AddLocationsDto {
  @ApiProperty({ type: [OrgUnitLocationMappingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrgUnitLocationMappingDto)
  locations: OrgUnitLocationMappingDto[];
}
