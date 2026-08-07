import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class EmployeeResponseDto {
  @ApiProperty({ description: 'معرف الموظف' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'معرف مساحة العمل' })
  @Expose()
  tenantId: string;

  @ApiProperty({ description: 'معرف المستخدم (في جدول users)' })
  @Expose()
  userId: string;

  @ApiProperty({ description: 'الرمز الوظيفي للموظف' })
  @Expose()
  employeeCode: string;

  @ApiProperty({ description: 'الاسم الكامل' })
  @Expose()
  fullName: string;

  @ApiProperty({ description: 'حالة الموظف (نشط أو غير نشط)' })
  @Expose()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'الرقم الوطني' })
  @Expose()
  nationalId?: string;

  @ApiProperty({ description: 'تاريخ الإنشاء' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'تاريخ التحديث' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'قائمة تعيينات الموظف (الفروع والصلاحيات)',
    type: () => [EmployeeAssignmentDto],
  })
  @Expose()
  @Type(() => EmployeeAssignmentDto)
  assignments: EmployeeAssignmentDto[] = [];
}

export class AssignmentRoleDto {
  @ApiProperty({ description: 'Role ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Role Name' })
  @Expose()
  name: string;
}

export class EmployeeAssignmentDto {
  @ApiProperty({ description: 'المعرف الفريد للتعيين' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'معرف الوحدة التنظيمية (الفرع/المستودع)' })
  @Expose()
  organizationUnitId: string;

  @ApiProperty({ description: 'Organization Unit Name' })
  @Expose()
  organizationUnitName: string;

  @ApiProperty({ description: 'Organization Unit Type' })
  @Expose()
  organizationUnitType: string;

  @ApiProperty({
    description: 'Roles in this Assignment',
    type: [AssignmentRoleDto],
  })
  @Expose()
  roles: AssignmentRoleDto[];
}
