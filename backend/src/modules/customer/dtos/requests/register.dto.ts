import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { normalizeCitizenPhone } from '../../../../common/utils/phone.util';

export class RegisterDto {
  @ApiProperty({
    example: 'sara@example.com',
    description: 'The email of the new customer',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'password123',
    minLength: 8,
    description: 'The password of the new customer',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: 'Sara Ahmad',
    description: 'The full name of the customer',
  })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({
    example: '0991234567',
    description: 'The phone number of the customer (Accepted formats: +963991234567, 963991234567, 0991234567)',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  phone!: string;
}
