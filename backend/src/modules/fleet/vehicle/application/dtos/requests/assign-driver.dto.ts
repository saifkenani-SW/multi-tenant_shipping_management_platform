import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignDriverDto {
  @ApiProperty({
    description: 'Employee (driver) identifier to assign to this vehicle',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;
}
