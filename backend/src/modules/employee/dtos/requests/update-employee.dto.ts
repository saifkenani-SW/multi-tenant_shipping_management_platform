import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * لا يمس البريد ولا كلمة المرور: هذه بيانات حساب، تغييرها يمر عبر
 * تدفقات الهوية (تأكيد بريد، إعادة تعيين كلمة مرور).
 *
 * التفعيل والتعطيل لهما نقطتان مستقلتان لأنهما يستلزمان إبطال الكاش.
 */
export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Full name', maxLength: 255 })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ description: 'National identifier', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'Code unique within the tenant',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  employeeCode?: string;
}
