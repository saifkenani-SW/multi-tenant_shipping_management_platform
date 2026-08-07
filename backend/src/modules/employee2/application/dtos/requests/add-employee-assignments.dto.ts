import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignmentInputDto {
  @ApiProperty({ description: 'Organization Unit ID' })
  @IsUUID()
  organizationUnitId: string;

  @ApiProperty({ description: 'Role IDs assigned in this unit', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  roleIds: string[];
}

export class AddEmployeeAssignmentsDto {
  @ApiProperty({ type: [AssignmentInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentInputDto)
  assignments: AssignmentInputDto[];
}
