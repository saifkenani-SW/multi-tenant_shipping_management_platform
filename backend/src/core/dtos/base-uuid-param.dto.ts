import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class BaseUuidParamDto {
  @ApiProperty({
    description: 'Unique Identifier (UUID v7)',
    example: '018b1a32-1b12-7000-8000-123456789abc',
  })
  @IsUUID('7', { message: 'id must be a valid UUID v7' })
  id: string;
}
