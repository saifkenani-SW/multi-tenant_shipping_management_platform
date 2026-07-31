import { ApiProperty } from '@nestjs/swagger';

export class TenantSubscriptionHistoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  subscriptionId: string;

  @ApiProperty()
  planId: string;

  @ApiProperty()
  action: string;

  @ApiProperty()
  performedAt: Date;

  @ApiProperty({ required: false })
  previousPlanId?: string | null;

  @ApiProperty({ required: false })
  notes?: string | null;

  @ApiProperty({ required: false })
  performedBy?: string | null;
}
