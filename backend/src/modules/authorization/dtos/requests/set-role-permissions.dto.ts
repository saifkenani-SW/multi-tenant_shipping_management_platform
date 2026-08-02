import { ApiProperty } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsUUID } from 'class-validator';

export class SetRolePermissionsDto {
  @ApiProperty({
    description: 'The full set of permission ids the role should have',
    type: [String],
    example: ['d290f1ee-6c54-4b01-90e6-d701748f0851'],
  })
  @IsArray()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  permissionIds: string[];
}
