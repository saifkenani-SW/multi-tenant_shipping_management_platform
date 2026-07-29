import { PaginationQueryDto } from '../dtos/pagination-query.dto';
import { Pagination } from '../value-objects/pagination';

export class OffsetPaginationBuilder {
  static build(query: PaginationQueryDto): Pagination {
    return new Pagination({
      page: query.page,
      limit: query.limit,
    });
  }
}
