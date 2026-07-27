import { PaginationMeta } from './pagination-meta';

export class PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly meta: PaginationMeta;

  constructor(data: readonly T[], meta: PaginationMeta) {
    this.data = data;
    this.meta = meta;
  }
}
