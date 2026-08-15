import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeCitizenPhone } from '../../../../../common/utils/phone.util';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;

  @ApiPropertyOptional({ 
    description: 'Accepted formats: +963991234567, 963991234567, 0991234567',
    example: '+963991234567' 
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  phone?: string;
}
