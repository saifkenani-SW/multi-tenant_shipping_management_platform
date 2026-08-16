import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserLoginType } from '../types/auth.types';

export class LoginDto {
  @ApiProperty({
    example: 'owner@logisticsplatform.com',
    description: 'The email of the user',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'password123',
    minLength: 6,
    description: 'The password of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({
    example: UserLoginType.PLATFORM_OWNER,
    enum: UserLoginType,
    description:
      'Optional: Specify profile type to bypass profile selection for multi-profile users',
  })
  @IsEnum(UserLoginType)
  @IsOptional()
  type?: UserLoginType;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description:
      'Optional: Specify tenant ID if the selected profile is TENANT_ADMIN or EMPLOYEE',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiProperty({
    example: 'eY5...zT9',
    description: 'The FCM device token for push notifications',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken!: string;
}
