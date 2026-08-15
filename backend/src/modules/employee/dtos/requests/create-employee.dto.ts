import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeCitizenPhone } from '../../../../common/utils/phone.util';

/**
 * ينشئ حساب users والموظف معاً: لا معنى لموظف لا يستطيع الدخول.
 * البريد وكلمة المرور يخصان الحساب، والباقي يخص سجل الموظف.
 */
export class CreateEmployeeDto {
  @ApiProperty({ description: 'Login email', example: 'employee@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Initial password',
    example: 'S3cure-Passw0rd',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({
    description: 'Contact phone (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '+963991234567',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Transform(({ value }) => normalizeCitizenPhone(value))
  phone?: string;

  @ApiProperty({
    description: 'Code unique within the tenant',
    example: 'EMP-0142',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode: string;

  @ApiProperty({ description: 'Full name', example: 'Sara Haddad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiPropertyOptional({ description: 'National identifier', maxLength: 50 })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'Organization unit to assign the employee to on creation',
  })
  @IsUUID()
  @IsOptional()
  organizationUnitId?: string;

  @ApiPropertyOptional({
    description: 'Roles granted at that assignment',
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds?: string[];
}
