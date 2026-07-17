import { TenantSearchField } from '../dtos/tenant-query.dto';

export interface ITenantQueryRepository {
  findMany(
    skip: number,
    take: number,
    search?: string,
    searchType?: TenantSearchField,
  ): Promise<[any[], number]>;
  findById(id: string): Promise<any | null>;
}
