import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../../../common/pagination/offset/dtos/pagination-query.dto';

class EmployeeBaseQueryDto {
  @ApiPropertyOptional({
    description: 'معرف مساحة العمل (للتصفية من قبل مدير المنصة)',
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({
    description: 'نص البحث للبحث في الاسم أو الرمز الوظيفي',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'تصفية الموظفين حسب الوحدة التنظيمية (الفرع/المستودع)',
  })
  @IsOptional()
  @IsUUID()
  organizationUnitId?: string;
}

export class EmployeeQueryDto extends IntersectionType(
  PaginationQueryDto,
  EmployeeBaseQueryDto,
) {}
