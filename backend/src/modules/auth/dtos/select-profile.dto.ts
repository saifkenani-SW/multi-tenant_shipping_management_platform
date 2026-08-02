import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserLoginType } from '../types/auth.types';

export class SelectProfileDto {
  @ApiProperty({
    example: UserLoginType.EMPLOYEE,
    enum: UserLoginType,
    description: 'The selected profile type',
  })
  @IsEnum(UserLoginType)
  @IsNotEmpty()
  type!: UserLoginType;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The tenant ID if the selected profile is TENANT_ADMIN or EMPLOYEE',
  })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
