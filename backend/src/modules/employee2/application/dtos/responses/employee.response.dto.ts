import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

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

  @ApiPropertyOptional({ description: 'الرقم الوطني' })
  @Expose()
  nationalId?: string;

  @ApiProperty({ description: 'تاريخ الإنشاء' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'تاريخ التحديث' })
  @Expose()
  updatedAt: Date;
}
