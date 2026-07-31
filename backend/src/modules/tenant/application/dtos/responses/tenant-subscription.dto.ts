import { ApiProperty } from '@nestjs/swagger';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';

export class TenantSubscriptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenantId: string;

  @ApiProperty()
  planId: string;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiProperty()
  startedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  snapshotMaxBranches: number;

  @ApiProperty()
  snapshotMaxWarehouses: number;

  @ApiProperty()
  snapshotMaxEmployees: number;

  @ApiProperty()
  snapshotMaxVehicles: number;

  @ApiProperty()
  snapshotMaxZones: number;

  @ApiProperty({ required: false })
  snapshotMaxMonthlyShipments?: number | null;

  @ApiProperty({ required: false })
  snapshotMaxMonthlyParcels?: number | null;

  @ApiProperty({ required: false })
  snapshotFeatures?: any;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  cancelledAt?: Date | null;

  @ApiProperty({ required: false })
  cancellationReason?: string | null;
}
