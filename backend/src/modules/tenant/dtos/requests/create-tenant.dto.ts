import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
    description: 'Primary contact email for the tenant admin',
    example: 'admin@globallogistics.com',
  })
  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;
}
