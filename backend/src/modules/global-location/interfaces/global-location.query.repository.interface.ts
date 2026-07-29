import { GlobalLocationQueryCriteria } from '../builders/query/global-location-query-criteria';
import { GlobalLocation } from '../domain/global-location.entity';

export interface IGlobalLocationQueryRepository {
  findMany(
    criteria: GlobalLocationQueryCriteria,
  ): Promise<[GlobalLocation[], number]>;

  findById(id: string): Promise<GlobalLocation | null>;

  /** السلسلة من الجذر حتى الأب المباشر. */
  findAncestors(id: string): Promise<GlobalLocation[]>;

  countChildren(id: string): Promise<number>;

  countOrgUnitMappings(id: string): Promise<number>;
}
