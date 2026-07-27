export interface PaginationMeta {
  total: number;
  currentPage: number;
  lastPage: number;
  perPage: number;
  prev: number | null;
  next: number | null;
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const lastPage = Math.ceil(total / limit);

  return {
    total,
    perPage: limit,
    currentPage: page,
    lastPage,

    prev: page > 1 ? page - 1 : null,

    next: page < lastPage ? page + 1 : null,
  };
}
