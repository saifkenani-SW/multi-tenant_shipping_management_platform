import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class AssignEmployeeDto {
  @ApiProperty({ description: 'Organization unit to assign the employee to' })
  @IsUUID()
  organizationUnitId: string;

  @ApiPropertyOptional({
    description: 'Roles granted at this assignment',
    type: [String],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds?: string[];
}
