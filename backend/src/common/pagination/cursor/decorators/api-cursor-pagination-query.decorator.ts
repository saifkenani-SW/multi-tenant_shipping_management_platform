import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function ApiCursorPaginationQuery() {
  return applyDecorators(
    ApiQuery({
      name: 'cursor',
      required: false,
      description: 'Pagination cursor (ID of last item on current page)',
      type: String,
    }),
    ApiQuery({
      name: 'limit',
      required: false,
      description: 'Number of items per page',
      type: Number,
      schema: { default: 10, minimum: 1, maximum: 100 },
    }),
  );
}
