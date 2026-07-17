import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { BasePaginationDto } from '../../../../core/dtos/base-pagination.dto';
import { SubscriptionPlanSearchField } from '../../enums/subscription-plan-search.enum';

export class SubscriptionPlanQueryDto extends BasePaginationDto {
  @ApiPropertyOptional({
    description: 'Field to search by. Defaults to name.',
    enum: SubscriptionPlanSearchField,
  })
  @IsEnum(SubscriptionPlanSearchField)
  @IsOptional()
  searchType?: SubscriptionPlanSearchField;
}
