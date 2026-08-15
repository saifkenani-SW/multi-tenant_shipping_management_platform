import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TenantOwnerResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the owner user',
    example: '01910b80-6e42-7000-8000-000000000000',
  })
  id: string;

  @ApiProperty({
    description: 'The email address of the owner user',
    example: 'admin@globallogistics.com',
  })
  email: string;

  @ApiPropertyOptional({
    description: 'The phone number of the owner user',
    example: '+971501234567',
  })
  phone: string | null;

  @ApiProperty({
    description: 'Whether the owner user is active',
    example: true,
  })
  isActive: boolean;
}
