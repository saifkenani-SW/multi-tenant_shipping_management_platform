import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignmentParamsDto {
  @ApiProperty({ description: 'Employee identifier' })
  @IsUUID()
  id: string;

  @ApiProperty({ description: 'Assignment identifier' })
  @IsUUID()
  assignmentId: string;
}
