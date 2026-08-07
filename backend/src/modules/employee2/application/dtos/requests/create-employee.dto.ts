import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ description: 'معرف المستخدم (من جدول users)' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

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
}
