import { Injectable } from '@nestjs/common';
import { OffsetPaginationBuilder } from '../../../../../../common/pagination';
import { TripQueryDto } from '../../dtos/requests/trip-query.dto';
import { TripQueryCriteria } from './trip-query-criteria';

@Injectable()
export class TripQueryCriteriaBuilder {
  build(query: TripQueryDto, tenantId: string): TripQueryCriteria {
    return new TripQueryCriteria(
      OffsetPaginationBuilder.build(query),
      tenantId,
      query.status,
      query.driverId,
      query.vehicleId,
      query.originOrgUnitId,
      query.destinationOrgUnitId,
    );
  }
}
