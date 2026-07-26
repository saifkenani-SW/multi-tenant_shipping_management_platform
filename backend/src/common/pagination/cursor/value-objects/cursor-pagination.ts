export interface CursorPaginationProps {
  readonly cursor?: string;
  readonly limit: number;
}

export class CursorPagination {
  readonly cursor?: string;
  readonly limit: number;
  readonly take: number;

  constructor(props: CursorPaginationProps) {
    this.cursor = props.cursor;
    this.limit = props.limit;
    this.take = props.limit;

    Object.freeze(this);
  }
}
