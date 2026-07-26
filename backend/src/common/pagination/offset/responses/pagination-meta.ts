import { Pagination } from '../value-objects/pagination';

export class PaginationMeta {
  readonly page: number;
  readonly limit: number;
  readonly total: number;

  constructor(pagination: Pagination, total: number) {
    this.page = pagination.page;
    this.limit = pagination.limit;
    this.total = total;
  }
}
