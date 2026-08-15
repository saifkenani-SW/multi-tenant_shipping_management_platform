import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeCitizenPhone } from '../../../../../common/utils/phone.util';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({
    description: 'The unique name of the shipping company',
    example: 'Global Logistics Inc.',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The unique tax number or business registration number',
    example: 'TAX-987654321',
  })
  @IsString()
  @IsNotEmpty()
  taxNumber: string;

  @ApiProperty({
    description: 'Primary email address for the tenant admin',
    example: 'admin@globallogistics.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Primary contact phone number (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '+963991234567',
  })
  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  phone: string;

  @ApiPropertyOptional({
    description: 'The UUID of an existing User who will own this Tenant',
    example: '01910b80-6e42-7000-8000-000000000000',
  })
  @IsUUID(7)
  @IsOptional()
  ownerUserId?: string;

  @ApiPropertyOptional({
    description: 'Email address for the tenant admin owner',
    example: 'admin@globallogistics.com',
  })
  @IsEmail()
  @IsOptional()
  ownerEmail?: string;

  @ApiPropertyOptional({
    description: 'Password for the tenant admin owner',
    example: 'password123',
  })
  @IsString()
  @IsOptional()
  ownerPassword?: string;

  @ApiProperty({
    description: 'Phone number for the tenant admin owner (Accepted formats: +963991234567, 963991234567, 0991234567)',
    example: '+963991234567',
    required: false,
  })
  @IsString()
  @MaxLength(50)
  @IsOptional()
  @Transform(({ value }) => normalizeCitizenPhone(value))
  ownerPhone?: string;
}
