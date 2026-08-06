import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * Base class for cursor pagination validation logic.
 * NOTE: Do NOT use @ApiPropertyOptional here — Swagger does not inherit
 * decorators from parent classes for @Query() params.
 * Each DTO must declare cursor/limit fields directly with @ApiPropertyOptional.
 */
export class CursorPaginationQueryDto {
  @IsString()
  @IsOptional()
  cursor?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit: number = 10;
}
