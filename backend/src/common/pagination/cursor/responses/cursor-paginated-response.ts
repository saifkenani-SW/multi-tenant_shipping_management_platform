export class CursorPaginationMeta {
  readonly nextCursor: string | null;
  readonly previousCursor: string | null;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly scope?: any;
}

export class CursorPaginatedResponse<T> {
  readonly data: readonly T[];
  readonly meta: CursorPaginationMeta;

  constructor(data: readonly T[], meta: CursorPaginationMeta) {
    this.data = data;
    this.meta = meta;
  }
}
