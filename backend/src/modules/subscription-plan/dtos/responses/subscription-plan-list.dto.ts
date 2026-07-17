import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionPlanDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  max_branches: number;

  @ApiProperty()
  max_warehouses: number;

  @ApiProperty()
  max_employees: number;

  @ApiProperty()
  max_vehicles: number;

  @ApiProperty()
  max_zones: number;

  @ApiProperty({ required: false })
  max_monthly_shipments?: number;

  @ApiProperty({ required: false })
  max_monthly_parcels?: number;

  @ApiProperty()
  price_monthly: number;

  @ApiProperty({ required: false })
  price_yearly?: number;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class PaginatedSubscriptionPlanListDto {
  @ApiProperty({ type: [SubscriptionPlanDetailsDto] })
  data: SubscriptionPlanDetailsDto[];

  @ApiProperty()
  meta: PaginationMetaDto;
}
