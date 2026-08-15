import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { normalizeCitizenPhone } from '../../../../../common/utils/phone.util';
import { AssignmentInputDto } from './add-employee-assignments.dto';

export class CreateEmployeeDto {
  @ApiPropertyOptional({ description: 'معرف المستخدم (من جدول users)' })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'البريد الإلكتروني لإنشاء حساب مستخدم جديد',
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'كلمة المرور لإنشاء حساب مستخدم جديد' })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ 
    description: 'رقم الهاتف لإنشاء حساب مستخدم جديد (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '+963991234567',
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  phone?: string;

  @ApiProperty({ description: 'الرمز الوظيفي للموظف' })
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @ApiProperty({ description: 'الاسم الكامل للموظف' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiPropertyOptional({ description: 'الرقم الوطني للموظف' })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiPropertyOptional({
    description:
      'الوحدات التنظيمية والصلاحيات المراد إسنادها للموظف عند الإنشاء',
    type: [AssignmentInputDto],
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AssignmentInputDto)
  assignments?: AssignmentInputDto[];
}
