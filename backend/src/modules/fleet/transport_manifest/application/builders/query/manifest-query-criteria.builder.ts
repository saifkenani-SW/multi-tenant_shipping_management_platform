import { Injectable } from '@nestjs/common';
import { OffsetPaginationBuilder } from '../../../../../../common/pagination';
import { ManifestQueryDto } from '../../dtos/requests/manifest-query.dto';
import { ManifestQueryCriteria } from './manifest-query-criteria';

@Injectable()
export class ManifestQueryCriteriaBuilder {
  build(
    query: ManifestQueryDto,
    tenantId: string | undefined,
  ): ManifestQueryCriteria {
    return new ManifestQueryCriteria(
      OffsetPaginationBuilder.build(query),
      tenantId,
      query.status,
      query.tripId,
      query.originOrgUnitId,
      query.destinationOrgUnitId,
    );
  }
}
