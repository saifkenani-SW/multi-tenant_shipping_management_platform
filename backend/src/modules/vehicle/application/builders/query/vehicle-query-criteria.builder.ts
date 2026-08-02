import { Injectable } from '@nestjs/common';
import { OffsetPaginationBuilder } from '../../../../../common/pagination';
import { VehicleQueryDto } from '../../dtos/requests/vehicle-query.dto';
import { VehicleQueryCriteria } from './vehicle-query-criteria';

@Injectable()
export class VehicleQueryCriteriaBuilder {
  build(query: VehicleQueryDto, tenantId: string): VehicleQueryCriteria {
    return new VehicleQueryCriteria(
      OffsetPaginationBuilder.build(query),
      tenantId,
      query.search,
      query.status,
      query.type,
    );
  }
}
