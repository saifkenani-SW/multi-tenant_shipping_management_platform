import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrgType } from '../../../domain/enums/org-type.enum';
import {
  LocationDto,
  OrgUnitLocationMappingDto,
} from '../requests/create-organization-unit.dto';

export class OrganizationUnitResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiPropertyOptional()
  zoneId?: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: OrgType })
  orgType: OrgType;

  @ApiPropertyOptional()
  addressLine?: string;

  @ApiPropertyOptional({ type: LocationDto })
  location?: LocationDto;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [OrgUnitLocationMappingDto] })
  coverageLocations?: OrgUnitLocationMappingDto[];
}
