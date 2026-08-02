import {
  ActionType,
  OrgType,
  ParcelCondition,
  ParcelStatus,
} from '@prisma/client';

export class AppendParcelMovementCommand {
  readonly tenantId: string;
  readonly parcelId: string;

  // Reference IDs
  readonly tripId?: string;
  readonly organizationUnitId?: string;
  readonly performedByEmployeeId: string;

  // Timeline
  readonly actionType: ActionType;

  // Status Transition
  readonly previousStatus?: ParcelStatus;
  readonly newStatus: ParcelStatus;

  readonly previousCondition?: ParcelCondition;
  readonly newCondition: ParcelCondition;

  // Organization Snapshot
  readonly organizationUnitName?: string;
  readonly organizationType?: OrgType;
  readonly organizationLatitude?: number;
  readonly organizationLongitude?: number;

  // Trip Snapshot
  readonly tripNumber?: string;

  // Employee Snapshot
  readonly performedByName: string;

  // Extra event data
  readonly metadata?: any;
  readonly notes?: string;
}
