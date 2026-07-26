import { CursorPaginationQueryDto } from '../dtos/cursor-pagination-query.dto';
import { CursorPagination } from '../value-objects/cursor-pagination';

export class CursorPaginationBuilder {
  static build(query: CursorPaginationQueryDto): CursorPagination {
    return new CursorPagination({
      cursor: query.cursor,
      limit: query.limit,
    });
  }
}
