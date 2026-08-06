import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class AddEmployeeAssignmentsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  organizationUnitIds: string[];
}
