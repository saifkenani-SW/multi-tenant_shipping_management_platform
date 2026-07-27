export interface PaginationProps {
  readonly page: number;
  readonly limit: number;
}

export class Pagination {
  readonly page: number;
  readonly limit: number;
  readonly skip: number;
  readonly take: number;

  constructor(props: PaginationProps) {
    this.page = props.page;
    this.limit = props.limit;
    this.skip = (props.page - 1) * props.limit;
    this.take = props.limit;

    Object.freeze(this);
  }
}
