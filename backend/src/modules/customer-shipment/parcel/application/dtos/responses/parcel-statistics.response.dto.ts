import { ApiProperty } from '@nestjs/swagger';
import { ParcelCondition, ParcelStatus } from '@prisma/client';

export class ParcelStatisticsItemDto {
  @ApiProperty({ enum: ParcelStatus })
  status: ParcelStatus;

  @ApiProperty({ enum: ParcelCondition })
  condition: ParcelCondition;

  @ApiProperty({ type: Number })
  count: number;
}

export class ParcelDirectionStatsDto {
  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: [ParcelStatisticsItemDto] })
  stats: ParcelStatisticsItemDto[];
}

export class ParcelOrgUnitStatsDto {
  @ApiProperty()
  orgUnitId: string;

  @ApiProperty({ type: String, nullable: true })
  orgUnitName: string | null;

  @ApiProperty({ type: ParcelDirectionStatsDto })
  current: ParcelDirectionStatsDto;

  @ApiProperty({ type: ParcelDirectionStatsDto })
  incoming: ParcelDirectionStatsDto;
}

export class ParcelTenantStatsDto {
  @ApiProperty()
  tenantId: string;

  @ApiProperty({ type: String, nullable: true })
  tenantName: string | null;

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: [ParcelOrgUnitStatsDto] })
  orgUnits: ParcelOrgUnitStatsDto[];
}

export class GetParcelStatisticsResponseDto {
  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: [ParcelTenantStatsDto] })
  tenants: ParcelTenantStatsDto[];
}
