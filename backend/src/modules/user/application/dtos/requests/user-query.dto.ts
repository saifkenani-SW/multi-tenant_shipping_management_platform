import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { CursorPaginationQueryDto } from '../../../../../common/pagination/cursor/dtos/cursor-pagination-query.dto';

/**
 * What kind of account a user holds. Derived from which profile rows exist for
 * them, not stored on the user itself.
 */
export enum UserAccountType {
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
  TENANT_OWNER = 'TENANT_OWNER',
  EMPLOYEE = 'EMPLOYEE',
  CUSTOMER = 'CUSTOMER',
}

export class UserQueryDto extends CursorPaginationQueryDto {
  @ApiPropertyOptional({
    description:
      'Free text matched against name and email. Two characters minimum.',
    example: 'sami',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    enum: UserAccountType,
    description: 'Narrow the list to one kind of account',
  })
  @IsEnum(UserAccountType)
  @IsOptional()
  accountType?: UserAccountType;

  @ApiPropertyOptional({
    description:
      'Platform owner only. Restricts the list to a single workspace; ignored for a tenant admin, who is always confined to their own.',
  })
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Cursor from the previous page' })
  @IsString()
  @IsOptional()
  declare cursor?: string;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  declare limit: number;
}
