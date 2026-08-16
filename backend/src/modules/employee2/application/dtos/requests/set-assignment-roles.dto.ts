import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class SetAssignmentRolesDto {
  @ApiProperty({
    description: 'قائمة بمعرفات الصلاحيات (Roles) المراد إسنادها',
    type: [String],
    example: ['00000000-0000-7000-8000-000000001111'],
  })
  @IsArray()
  @IsUUID('7', { each: true })
  @ArrayMinSize(1)
  roleIds: string[];
}
